import React, { useState } from 'react';
import { Package, Plus, Star, Trash2, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductCategory } from '../../types';
import { LocalDB } from '../../services/db';

interface ProductShelfProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const ProductShelf: React.FC<ProductShelfProps> = ({
  products,
  onUpdateProducts,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('serum');
  const [newProdIngredients, setNewProdIngredients] = useState('');
  const [newProdNotes, setNewProdNotes] = useState('');

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: newProdName,
      brand: newProdBrand || 'نامشخص',
      category: newProdCategory,
      ingredients: newProdIngredients ? newProdIngredients.split('،').map((s) => s.trim()) : [],
      owned: true,
      notes: newProdNotes,
      rating: 5,
    };

    const updated = [newProd, ...products];
    onUpdateProducts(updated);
    LocalDB.saveProducts(updated);

    // Reset form
    setNewProdName('');
    setNewProdBrand('');
    setNewProdIngredients('');
    setNewProdNotes('');
    setShowAddModal(false);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    onUpdateProducts(updated);
    LocalDB.saveProducts(updated);
  };

  const categoryLabels: Record<ProductCategory, string> = {
    cleanser: 'شوینده و پاک‌کننده',
    moisturizer: 'مرطوب‌کننده و آبرسان',
    serum: 'سرم تخصصی',
    sunscreen: 'ضدآفتاب',
    treatment: 'درمان موضـعی (ضدجوش/ضدلک)',
    mask: 'ماسک صورت',
    eyecare: 'کرم دور چشم',
    toner: 'تونر و میست',
    exfoliant: 'لایه‌بردار',
    haircare: 'مراقبت از مو',
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#2e2621]">کیف محصولات پوستی من</h2>
          <p className="text-xs text-[#8a766c]">مدیریت محصولات موجود جهت شخصی‌سازی روتین</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#8e5241] hover:bg-[#784334] text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          افزایش محصول جدید
        </button>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-[#ebe0d4] text-[#8a766c] text-xs font-bold space-y-2">
            <Package className="w-8 h-8 mx-auto text-[#c7b5a5]" />
            <p>هنوز هیچ محصولی به کیف خود اضافه نکرده‌اید.</p>
          </div>
        ) : (
          products.map((prod) => (
            <div
              key={prod.id}
              className="p-4 rounded-3xl bg-white border border-[#ebe0d4] shadow-xs text-right space-y-2 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f6ede5] text-[#8e5241] text-[10px] font-extrabold border border-[#eddcd0]">
                    {categoryLabels[prod.category]}
                  </span>
                  <h3 className="font-extrabold text-sm text-[#2e2621] mt-1">
                    {prod.name}
                  </h3>
                  <span className="text-xs text-[#8a766c] font-medium">{prod.brand}</span>
                </div>

                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  title="حذف محصول"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {prod.ingredients && prod.ingredients.length > 0 && (
                <div className="text-xs text-[#6e5d50]">
                  <strong>ترکیبات اصلی: </strong>
                  {prod.ingredients.join('، ')}
                </div>
              )}

              {prod.notes && (
                <p className="text-xs text-[#705c4f] bg-[#f9f4ee] p-2.5 rounded-xl border border-[#efe2d6]">
                  {prod.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#faf6f0] text-right space-y-4 shadow-2xl border border-[#ebe0d4]"
            >
              <div className="flex items-center justify-between border-b border-[#e5d8cb] pb-3">
                <h3 className="text-base font-black text-[#2e2621]">افزایش محصول جدید به کیف</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-2xl bg-white text-[#5c4a3e] border border-[#e5d8cb]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#5c4a3e] block mb-1">نام محصول:</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="مثلاً: سرم نیاسینامید اوردینری"
                    className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#ebe0d4] text-xs font-bold text-[#382f29]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c4a3e] block mb-1">برند:</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="مثلاً: The Ordinary"
                    className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#ebe0d4] text-xs font-bold text-[#382f29]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c4a3e] block mb-1">دسته‌بندی:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#ebe0d4] text-xs font-bold text-[#382f29]"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c4a3e] block mb-1">
                    ترکیبات اصلی (با ویرگول جدا کنید):
                  </label>
                  <input
                    type="text"
                    value={newProdIngredients}
                    onChange={(e) => setNewProdIngredients(e.target.value)}
                    placeholder="نیاسینامید، زینک، هیالورونیک اسید"
                    className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#ebe0d4] text-xs font-bold text-[#382f29]"
                  />
                </div>
              </div>

              <button
                onClick={handleAddProduct}
                className="w-full py-3 rounded-2xl bg-[#8e5241] text-white text-xs font-bold shadow-md active:scale-95 transition-all mt-2"
              >
                ذخیره محصول در کیف
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
