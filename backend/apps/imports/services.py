import io
from decimal import Decimal
import pandas as pd
from django.db import transaction
from django.utils import timezone
from businesses.models import Store
from purchases.models import Supplier, PurchaseOrder, PurchaseItem
from inventory.models import Product
from sales.models import Sale
from expenses.models import Expense
from .models import ImportBatch

# Schema definition for each dataset type
REQUIRED_HEADERS = {
    'suppliers': {'supplier_id', 'supplier_name'},
    'inventory': {'product_id', 'product_name', 'current_stock'},
    'purchases': {'date', 'product_id', 'quantity_purchased', 'unit_cost', 'supplier_id'},
    'sales': {'date', 'product_id', 'quantity_sold'},
    'expenses': {'date', 'category', 'amount'},
}

# Topological execution order for relational dependencies
DEPENDENCY_ORDER = ['suppliers', 'inventory', 'purchases', 'sales', 'expenses']


def detect_dataset_type(columns):
    """
    Automatically deduce dataset type by checking column headers.
    """
    col_set = {str(c).strip().lower() for c in columns}
    if {'supplier_id', 'supplier_name'}.issubset(col_set) and 'product_id' not in col_set:
        return 'suppliers'
    if {'product_id', 'product_name'}.issubset(col_set):
        return 'inventory'
    if {'order_number', 'supplier_id', 'product_id'}.issubset(col_set) or ({'quantity_purchased', 'supplier_id'}.issubset(col_set)):
        return 'purchases'
    if {'transaction_id', 'quantity_sold'}.issubset(col_set) or ({'product_id', 'quantity_sold'}.issubset(col_set) and 'quantity_purchased' not in col_set):
        return 'sales'
    if {'category', 'amount'}.issubset(col_set) and 'quantity_sold' not in col_set:
        return 'expenses'
    return 'unknown'


def parse_uploaded_file(uploaded_file):
    """
    Parse an in-memory CSV or Excel file into a pandas DataFrame.
    """
    file_name = uploaded_file.name.lower()
    content = uploaded_file.read()
    uploaded_file.seek(0)

    if file_name.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(io.BytesIO(content))
    else:
        # Try UTF-8 first, fallback to Latin-1
        try:
            df = pd.read_csv(io.StringIO(content.decode('utf-8-sig')))
        except UnicodeDecodeError:
            df = pd.read_csv(io.StringIO(content.decode('latin-1')))

    # Normalize column names: lowercase, strip whitespace, replace spaces with underscores
    df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
    return df


class MultiFileValidator:
    """
    Validates uploaded files and generates previews and plain-language issue logs.
    """
    @classmethod
    def validate_file(cls, uploaded_file, dataset_type_override=None):
        df = parse_uploaded_file(uploaded_file)
        detected_type = dataset_type_override or detect_dataset_type(df.columns)
        issues = []

        if detected_type == 'unknown':
            issues.append("Could not automatically determine dataset type. Please map columns manually.")
            return {
                'file_name': uploaded_file.name,
                'detected_type': 'unknown',
                'is_valid': False,
                'total_rows': len(df),
                'columns': list(df.columns),
                'issues': issues,
                'preview_rows': df.head(5).to_dict(orient='records'),
            }

        required = REQUIRED_HEADERS.get(detected_type, set())
        missing = required - set(df.columns)
        if missing:
            issues.append(f"Missing required columns for {detected_type}: {', '.join(sorted(missing))}")

        # Row-level validation checks
        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed + header row
            if detected_type == 'sales':
                if pd.isna(row.get('date')) or str(row.get('date')).strip() == '':
                    issues.append(f"Row {row_num}: Date is missing.")
                try:
                    qty = float(row.get('quantity_sold', 0))
                    if qty <= 0:
                        issues.append(f"Row {row_num}: Quantity sold must be greater than zero.")
                except (ValueError, TypeError):
                    issues.append(f"Row {row_num}: Invalid quantity sold format.")

            elif detected_type == 'inventory':
                if pd.isna(row.get('product_id')) or str(row.get('product_id')).strip() == '':
                    issues.append(f"Row {row_num}: Product ID (SKU) is missing.")
                if pd.isna(row.get('product_name')) or str(row.get('product_name')).strip() == '':
                    issues.append(f"Row {row_num}: Product name is missing.")

            elif detected_type == 'expenses':
                if pd.isna(row.get('date')):
                    issues.append(f"Row {row_num}: Expense date is missing.")
                try:
                    amt = float(row.get('amount', 0))
                    if amt <= 0:
                        issues.append(f"Row {row_num}: Expense amount must be greater than zero.")
                except (ValueError, TypeError):
                    issues.append(f"Row {row_num}: Invalid expense amount format.")

            # Limit reported issues to first 50 to keep payload manageable
            if len(issues) >= 50:
                issues.append("...and more issues detected.")
                break

        return {
            'file_name': uploaded_file.name,
            'detected_type': detected_type,
            'is_valid': len(issues) == 0,
            'total_rows': len(df),
            'columns': list(df.columns),
            'issues': issues,
            'preview_rows': df.head(5).fillna('').to_dict(orient='records'),
        }


class BatchImporter:
    """
    Executes transaction-safe, dependency-ordered ingestion of validated files.
    """
    def __init__(self, business, user=None):
        self.business = business
        self.user = user

    def import_batch(self, file_dict):
        """
        file_dict: mapping of dataset_type -> uploaded_file
        """
        results = {}
        # Ensure execution order matches dependencies
        ordered_types = [t for t in DEPENDENCY_ORDER if t in file_dict]

        with transaction.atomic():
            for d_type in ordered_types:
                file_obj = file_dict[d_type]
                df = parse_uploaded_file(file_obj)
                res = self._process_dataset(d_type, df, file_obj.name, file_obj.size)
                results[d_type] = res

        return results

    def _process_dataset(self, dataset_type, df, file_name, file_size):
        batch = ImportBatch.objects.create(
            business=self.business,
            uploaded_by=self.user,
            file_name=file_name,
            dataset_type=dataset_type,
            file_size_bytes=file_size,
            status='PROCESSING',
            total_rows=len(df),
        )

        imported = 0
        skipped = 0
        failed = 0
        errors = []

        stores_cache = {}
        for s in Store.objects.filter(business=self.business):
            stores_cache[s.code] = s
            stores_cache[s.name] = s
            if s.ml_store_id:
                stores_cache[str(s.ml_store_id)] = s

        default_store = Store.objects.filter(business=self.business).first()

        def resolve_store(ref):
            ref_str = str(ref).strip() if (ref is not None and pd.notna(ref)) else ''
            if not ref_str:
                return default_store
            if ref_str in stores_cache:
                return stores_cache[ref_str]
            # Auto-discover and create store dynamically from dataset
            cnt = Store.objects.filter(business=self.business).count()
            new_name = f"Store #{ref_str}" if ref_str.isdigit() else ref_str
            new_code = ref_str if ref_str.isupper() and len(ref_str) <= 10 else f"LOC-{cnt + 1:02d}"
            st, _ = Store.objects.get_or_create(
                business=self.business,
                name=new_name,
                defaults={
                    'code': new_code,
                    'city': 'Primary Hub',
                    'ml_store_id': cnt + 1,
                    'is_active': True,
                }
            )
            stores_cache[ref_str] = st
            stores_cache[st.name] = st
            stores_cache[st.code] = st
            if st.ml_store_id:
                stores_cache[str(st.ml_store_id)] = st
            return st

        suppliers_cache = {s.supplier_code or s.name: s for s in Supplier.objects.filter(business=self.business)}
        products_cache = {p.sku: p for p in Product.objects.filter(business=self.business)}
        seen_txns = {}
        seen_recs = {}
        seen_pos = {}

        for idx, row in df.iterrows():
            row_num = idx + 2
            try:
                if dataset_type == 'suppliers':
                    s_code = str(row.get('supplier_id', '')).strip()
                    s_name = str(row.get('supplier_name', '')).strip()
                    if not s_name:
                        failed += 1
                        errors.append(f"Row {row_num}: Supplier name is required.")
                        continue

                    supplier, created = Supplier.objects.update_or_create(
                        business=self.business,
                        name=s_name,
                        defaults={
                            'supplier_code': s_code,
                            'contact_name': str(row.get('contact_name', '')).strip(),
                            'email': str(row.get('email', '')).strip(),
                            'phone': str(row.get('phone', '')).strip(),
                            'city': str(row.get('city', '')).strip(),
                            'payment_terms': str(row.get('payment_terms', 'Net 30')).strip(),
                        }
                    )
                    suppliers_cache[s_code or s_name] = supplier
                    suppliers_cache[s_name] = supplier
                    imported += 1

                elif dataset_type == 'inventory':
                    sku = str(row.get('product_id', '')).strip()
                    p_name = str(row.get('product_name', '')).strip()
                    if not sku or not p_name:
                        failed += 1
                        errors.append(f"Row {row_num}: Product ID and Name are required.")
                        continue

                    sup_ref = str(row.get('supplier_id', '')).strip()
                    supplier = suppliers_cache.get(sup_ref)

                    store_ref = row.get('store_id') or row.get('store_name') or row.get('store') or row.get('branch')
                    store = resolve_store(store_ref)

                    product, created = Product.objects.update_or_create(
                        business=self.business,
                        sku=sku,
                        defaults={
                            'name': p_name,
                            'category': str(row.get('category', 'General')).strip(),
                            'current_stock': int(row.get('current_stock', 0)),
                            'reorder_level': int(row.get('reorder_level', 10)),
                            'unit_cost': Decimal(str(row.get('unit_cost', 0))),
                            'selling_price': Decimal(str(row.get('selling_price', 0))),
                            'supplier': supplier,
                            'store': store,
                            'ml_item_id': int(row.get('ml_item_id')) if pd.notna(row.get('ml_item_id')) else None,
                        }
                    )
                    products_cache[sku] = product
                    imported += 1

                elif dataset_type == 'purchases':
                    raw_po = str(row.get('order_number', '')).strip() if pd.notna(row.get('order_number')) else ''
                    if not raw_po or raw_po.lower() in ('nan', 'none', ''):
                        order_no = f"PO-{row_num}"
                    else:
                        cnt = seen_pos.get(raw_po, 0)
                        seen_pos[raw_po] = cnt + 1
                        order_no = f"{raw_po}-{cnt + 1}" if cnt > 0 else raw_po

                    p_sku = str(row.get('product_id', '')).strip()
                    product = products_cache.get(p_sku)
                    if not product:
                        failed += 1
                        errors.append(f"Row {row_num}: Product '{p_sku}' not found in inventory. Import inventory.csv first.")
                        continue

                    sup_ref = str(row.get('supplier_id', '')).strip()
                    supplier = suppliers_cache.get(sup_ref) or product.supplier
                    if not supplier:
                        failed += 1
                        errors.append(f"Row {row_num}: Supplier '{sup_ref}' not found. Import suppliers.csv first.")
                        continue

                    qty = int(row.get('quantity_purchased', 1))
                    unit_cost = Decimal(str(row.get('unit_cost', product.unit_cost)))
                    date_val = pd.to_datetime(row.get('date')).date()

                    po, _ = PurchaseOrder.objects.get_or_create(
                        business=self.business,
                        order_number=order_no,
                        defaults={
                            'supplier': supplier,
                            'date': date_val,
                            'status': str(row.get('status', 'RECEIVED')).strip().upper(),
                            'total_cost': Decimal(qty) * unit_cost,
                        }
                    )

                    PurchaseItem.objects.create(
                        purchase_order=po,
                        product=product,
                        quantity=qty,
                        unit_cost=unit_cost,
                        total_cost=Decimal(qty) * unit_cost,
                    )

                    # If status is received, increase current stock
                    if po.status == 'RECEIVED':
                        product.current_stock += qty
                        product.save(update_fields=['current_stock'])

                    imported += 1

                elif dataset_type == 'sales':
                    p_sku = str(row.get('product_id', '')).strip()
                    product = products_cache.get(p_sku)
                    if not product:
                        failed += 1
                        errors.append(f"Row {row_num}: Product '{p_sku}' not found in inventory. Import inventory.csv first.")
                        continue

                    raw_txn = str(row.get('transaction_id', '')).strip() if pd.notna(row.get('transaction_id')) else ''
                    if not raw_txn or raw_txn.lower() in ('nan', 'none', ''):
                        txn_id = f"TXN-{row_num}"
                    else:
                        cnt = seen_txns.get(raw_txn, 0)
                        seen_txns[raw_txn] = cnt + 1
                        txn_id = f"{raw_txn}-{cnt + 1}" if cnt > 0 else raw_txn

                    date_val = pd.to_datetime(row.get('date')).date()
                    qty = int(row.get('quantity_sold', 1))
                    u_price = Decimal(str(row.get('unit_price', product.selling_price)))
                    discount = Decimal(str(row.get('discount', 0)))

                    store_ref = row.get('store_id') or row.get('store_name') or row.get('store') or row.get('branch')
                    store = resolve_store(store_ref) or product.store

                    sale, _ = Sale.objects.update_or_create(
                        business=self.business,
                        transaction_id=txn_id,
                        defaults={
                            'store': store,
                            'product': product,
                            'date': date_val,
                            'quantity_sold': qty,
                            'unit_price': u_price,
                            'discount': discount,
                            'payment_method': str(row.get('payment_method', 'UPI')).strip().upper(),
                        }
                    )

                    # Deduct stock for recorded sale
                    product.current_stock = max(0, product.current_stock - qty)
                    product.save(update_fields=['current_stock'])
                    imported += 1

                elif dataset_type == 'expenses':
                    date_val = pd.to_datetime(row.get('date')).date()
                    category = str(row.get('category', 'Miscellaneous')).strip()
                    amount = Decimal(str(row.get('amount', 0)))

                    raw_rec = str(row.get('receipt_reference', '')).strip() if pd.notna(row.get('receipt_reference')) else ''
                    if not raw_rec or raw_rec.lower() in ('nan', 'none', ''):
                        rec_ref = f"REC-{row_num}"
                    else:
                        cnt = seen_recs.get(raw_rec, 0)
                        seen_recs[raw_rec] = cnt + 1
                        rec_ref = f"{raw_rec}-{cnt + 1}" if cnt > 0 else raw_rec

                    store_ref = row.get('store_id') or row.get('store_name') or row.get('store') or row.get('branch')
                    store = resolve_store(store_ref)

                    expense, _ = Expense.objects.update_or_create(
                        business=self.business,
                        receipt_reference=rec_ref,
                        defaults={
                            'store': store,
                            'date': date_val,
                            'category': category,
                            'amount': amount,
                            'description': str(row.get('description', '')).strip(),
                            'vendor': str(row.get('vendor', '')).strip(),
                        }
                    )
                    imported += 1

            except Exception as e:
                failed += 1
                errors.append(f"Row {row_num}: {str(e)}")

        batch.imported_rows = imported
        batch.skipped_rows = skipped
        batch.failed_rows = failed
        batch.error_summary = errors
        batch.status = 'COMPLETED' if failed == 0 else ('PARTIAL' if imported > 0 else 'FAILED')
        batch.completed_at = timezone.now()
        batch.save()

        return {
            'batch_id': str(batch.id),
            'dataset_type': dataset_type,
            'file_name': file_name,
            'status': batch.status,
            'total_rows': batch.total_rows,
            'imported_rows': imported,
            'skipped_rows': skipped,
            'failed_rows': failed,
            'errors': errors[:20],
        }


import os
from pathlib import Path
from django.conf import settings

_last_synced_mtimes = {}

def get_datasets_dir():
    return settings.BASE_DIR.parent / 'datasets'

def safe_read_file_bytes(file_path):
    """
    Safely read file bytes, handling Windows file-locking when opened in Microsoft Excel.
    """
    try:
        with open(file_path, 'rb') as f:
            return f.read()
    except (PermissionError, OSError):
        if os.name == 'nt':
            import ctypes
            from ctypes import wintypes
            kernel32 = ctypes.windll.kernel32
            # Open with FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE (7)
            h = kernel32.CreateFileW(
                str(file_path),
                0x80000000,  # GENERIC_READ
                1 | 2 | 4,   # FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE
                None,
                3,           # OPEN_EXISTING
                0x80,        # FILE_ATTRIBUTE_NORMAL
                None,
            )
            if h != -1 and h != 0xFFFFFFFFFFFFFFFF:
                try:
                    size = kernel32.GetFileSize(h, None)
                    if size > 0:
                        buf = ctypes.create_string_buffer(size)
                        read = wintypes.DWORD()
                        if kernel32.ReadFile(h, buf, size, ctypes.byref(read), None):
                            return buf.raw[:read.value]
                finally:
                    kernel32.CloseHandle(h)
        raise

def find_latest_dataset_file(datasets_dir, d_type):
    """
    Find candidate file for dataset type across datasets_dir and subdirectories (e.g. EXCEL/),
    returning the Path of the one with the latest modification time.
    """
    valid_names = {
        f"{d_type}.xlsx",
        f"{d_type}.xls",
        f"{d_type}.csv",
    }
    candidates = []
    datasets_path = Path(datasets_dir)
    if not datasets_path.exists():
        return None

    for root, _, files in os.walk(datasets_path):
        for f in files:
            if f.lower() in valid_names:
                full_path = Path(root) / f
                try:
                    mtime = os.path.getmtime(full_path)
                    candidates.append((mtime, full_path))
                except Exception:
                    pass
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]

def sync_local_datasets(business, user=None, force=False):
    """
    Automatically synchronize records from files in the `datasets/` folder into PostgreSQL.
    Detects file modification timestamps and sizes across datasets/ and subdirectories (like EXCEL/)
    to prevent redundant re-imports while instantly picking up user edits.
    """
    datasets_dir = get_datasets_dir()
    if not datasets_dir.exists():
        return {'status': 'skipped', 'message': 'No datasets directory found.'}

    file_types = ['suppliers', 'inventory', 'purchases', 'sales', 'expenses']
    mtimes = {}
    target_files = {}

    for d_type in file_types:
        chosen = find_latest_dataset_file(datasets_dir, d_type)
        if chosen:
            target_files[d_type] = chosen
            try:
                mtimes[f"{d_type}:{chosen}"] = (os.path.getmtime(chosen), os.path.getsize(chosen))
            except Exception:
                pass

    b_key = str(business.id)
    last_mtimes = _last_synced_mtimes.get(b_key, {})
    if not force and last_mtimes == mtimes:
        return {'status': 'up_to_date', 'message': 'Datasets already up to date.'}

    importer = BatchImporter(business=business, user=user)
    results = {}

    for d_type in DEPENDENCY_ORDER:
        chosen = target_files.get(d_type)
        if chosen and chosen.exists():
            try:
                raw_bytes = safe_read_file_bytes(chosen)
                if chosen.suffix.lower() in ('.xlsx', '.xls'):
                    df = pd.read_excel(io.BytesIO(raw_bytes))
                else:
                    try:
                        df = pd.read_csv(io.StringIO(raw_bytes.decode('utf-8-sig')))
                    except UnicodeDecodeError:
                        df = pd.read_csv(io.StringIO(raw_bytes.decode('latin-1')))
                df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
                res = importer._process_dataset(d_type, df, chosen.name, len(raw_bytes))
                results[d_type] = res
            except Exception as e:
                results[d_type] = {'error': str(e)}

    _last_synced_mtimes[b_key] = mtimes
    return {'status': 'synced', 'results': results}
