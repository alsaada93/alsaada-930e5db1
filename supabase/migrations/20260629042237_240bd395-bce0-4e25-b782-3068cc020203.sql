-- إزالة سياسة القراءة المفتوحة لجميع المستخدمين المسجّلين على أرقام البائعين.
-- تبقى القراءة للمشرفين فقط، ويُجلب رقم البائع الواحد عبر الدالة الآمنة get_seller_phone.
DROP POLICY IF EXISTS "Seller contacts viewable by authenticated users" ON public.seller_contacts;