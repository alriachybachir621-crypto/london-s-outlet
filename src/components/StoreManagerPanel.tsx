import React, { useEffect, useState } from 'react';
import {
  Check,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  PASSCODE_SUFFIX,
  auth,
  db,
  handleFirestoreError,
  OperationType,
  uploadImageAsset,
} from '../lib/firebase';
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STORE_INFO,
} from '../data/defaults';
import { Brand, Category, Product, StoreInfo } from '../types';
import { ResilientImage } from './Icons';

interface StoreManagerPanelProps {
  open: boolean;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  storeInfo: StoreInfo;
  onClose: () => void;
}

type ManagerTab = 'products' | 'categories' | 'brands' | 'store' | 'security';

function slugifyId(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'item'}-${Date.now().toString(36)}`;
}

export function StoreManagerPanel({
  open,
  products,
  categories,
  brands,
  storeInfo,
  onClose,
}: StoreManagerPanelProps) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('products');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pNameEn, setPNameEn] = useState('');
  const [pNameAr, setPNameAr] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('45');
  const [pOldPrice, setPOldPrice] = useState('');
  const [pSizes, setPSizes] = useState('S, M, L, XL');
  const [pColors, setPColors] = useState('Black, Navy');
  const [pImages, setPImages] = useState<string[]>([]);
  const [pImageUrlInput, setPImageUrlInput] = useState('');
  const [pInStock, setPInStock] = useState(true);
  const [pIsNew, setPIsNew] = useState(true);
  const [pIsSale, setPIsSale] = useState(false);
  const [pDescEn, setPDescEn] = useState('');
  const [pDescAr, setPDescAr] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);

  // Category editor state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [cNameEn, setCNameEn] = useState('');
  const [cNameAr, setCNameAr] = useState('');
  const [cImage, setCImage] = useState('');
  const [cOrder, setCOrder] = useState('1');

  // Brand editor state
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [bName, setBName] = useState('');
  const [bOrder, setBOrder] = useState('1');

  // Store info editor state
  const [storeDraft, setStoreDraft] = useState<StoreInfo>(storeInfo);
  const [heroUrlInput, setHeroUrlInput] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  // Change code state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  useEffect(() => {
    setStoreDraft(storeInfo);
  }, [storeInfo]);

  // Seed default catalog into Firestore once when authenticated for the first time
  useEffect(() => {
    if (!open) return;
    if (storeInfo.catalogSeeded) return;
    if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) return;

    let cancelled = false;
    const seedStarterData = async () => {
      try {
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach((cat) => {
          batch.set(doc(db, 'categories', cat.id), {
            nameEn: cat.nameEn,
            nameAr: cat.nameAr,
            image: cat.image,
            sortOrder: cat.sortOrder,
          });
        });
        DEFAULT_BRANDS.forEach((br) => {
          batch.set(doc(db, 'brands', br.id), {
            name: br.name,
            sortOrder: br.sortOrder,
          });
        });
        DEFAULT_PRODUCTS.forEach((pr) => {
          batch.set(doc(db, 'products', pr.id), {
            nameEn: pr.nameEn,
            nameAr: pr.nameAr,
            brand: pr.brand,
            category: pr.category,
            priceUsd: pr.priceUsd,
            oldPriceUsd: pr.oldPriceUsd ?? null,
            sizes: pr.sizes,
            colors: pr.colors,
            images: pr.images,
            inStock: pr.inStock,
            isNew: pr.isNew,
            isSale: pr.isSale,
            descriptionEn: pr.descriptionEn || '',
            descriptionAr: pr.descriptionAr || '',
            sortOrder: pr.sortOrder || 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });
        batch.set(
          doc(db, 'store', 'info'),
          {
            ...DEFAULT_STORE_INFO,
            ...storeInfo,
            codeConfigured: true,
            catalogSeeded: true,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        await batch.commit();
      } catch (err) {
        if (!cancelled) {
          handleFirestoreError(err, OperationType.WRITE, 'seed');
        }
      }
    };
    seedStarterData();
    return () => {
      cancelled = true;
    };
  }, [open, storeInfo]);

  if (!open) return null;

  const flashStatus = (msg: string) => {
    setErrorMsg('');
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3200);
  };

  const openNewProductForm = () => {
    setEditingProduct(null);
    setPNameEn('');
    setPNameAr('');
    setPBrand(brands[0]?.name || 'Nike');
    setPCategory(categories[0]?.id || 'sneakers');
    setPPrice('45');
    setPOldPrice('');
    setPSizes('S, M, L, XL');
    setPColors('Black, Navy');
    setPImages([]);
    setPImageUrlInput('');
    setPInStock(true);
    setPIsNew(true);
    setPIsSale(false);
    setPDescEn('');
    setPDescAr('');
    setShowProductForm(true);
  };

  const openEditProductForm = (p: Product) => {
    setEditingProduct(p);
    setPNameEn(p.nameEn);
    setPNameAr(p.nameAr);
    setPBrand(p.brand);
    setPCategory(p.category);
    setPPrice(String(p.priceUsd));
    setPOldPrice(p.oldPriceUsd != null ? String(p.oldPriceUsd) : '');
    setPSizes((p.sizes || []).join(', '));
    setPColors((p.colors || []).join(', '));
    setPImages(p.images || []);
    setPImageUrlInput('');
    setPInStock(p.inStock);
    setPIsNew(p.isNew);
    setPIsSale(p.isSale);
    setPDescEn(p.descriptionEn || '');
    setPDescAr(p.descriptionAr || '');
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNameEn.trim() || !pBrand.trim() || !pCategory.trim()) {
      setErrorMsg('Please fill product name, brand, and category.');
      return;
    }
    const priceNum = Number(pPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Enter a valid USD price.');
      return;
    }
    const oldNum = pOldPrice.trim() ? Number(pOldPrice) : null;
    if (oldNum !== null && (Number.isNaN(oldNum) || oldNum < 0)) {
      setErrorMsg('Enter a valid old price.');
      return;
    }

    setBusy(true);
    setErrorMsg('');
    const id = editingProduct ? editingProduct.id : slugifyId(pNameEn);
    const sizesArr = pSizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    const colorsArr = pColors
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);
    const imagesArr = pImages.slice(0, 8);

    const payload: Record<string, unknown> = {
      nameEn: pNameEn.trim().slice(0, 120),
      nameAr: (pNameAr.trim() || pNameEn.trim()).slice(0, 120),
      brand: pBrand.trim().slice(0, 60),
      category: pCategory.trim().slice(0, 60),
      priceUsd: priceNum,
      oldPriceUsd: oldNum,
      sizes: sizesArr,
      colors: colorsArr,
      images: imagesArr,
      inStock: pInStock,
      isNew: pIsNew,
      isSale: pIsSale,
      descriptionEn: pDescEn.trim().slice(0, 1000),
      descriptionAr: pDescAr.trim().slice(0, 1000),
      sortOrder: editingProduct?.sortOrder ?? products.length + 1,
      updatedAt: Date.now(),
    };
    if (!editingProduct) {
      payload.createdAt = Date.now();
    }

    try {
      await setDoc(doc(db, 'products', id), payload, { merge: true });
      setShowProductForm(false);
      flashStatus(editingProduct ? 'Product updated.' : 'Product added.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      flashStatus('Product deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 8 - pImages.length)) {
        const url = await uploadImageAsset(file, 'products');
        uploaded.push(url);
      }
      setPImages((prev) => [...prev, ...uploaded].slice(0, 8));
    } catch {
      setErrorMsg('Failed to process image upload.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNameEn.trim() || !cImage.trim()) {
      setErrorMsg('Category name and image are required.');
      return;
    }
    setBusy(true);
    const id = editingCategory ? editingCategory.id : slugifyId(cNameEn);
    try {
      await setDoc(doc(db, 'categories', id), {
        nameEn: cNameEn.trim().slice(0, 60),
        nameAr: (cNameAr.trim() || cNameEn.trim()).slice(0, 60),
        image: cImage.trim().slice(0, 150000),
        sortOrder: Number(cOrder) || 1,
      });
      setEditingCategory(null);
      setCNameEn('');
      setCNameAr('');
      setCImage('');
      setCOrder(String(categories.length + 1));
      flashStatus('Category saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'categories', id));
      flashStatus('Category removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;
    setBusy(true);
    const id = editingBrand ? editingBrand.id : slugifyId(bName);
    try {
      await setDoc(doc(db, 'brands', id), {
        name: bName.trim().slice(0, 60),
        sortOrder: Number(bOrder) || brands.length + 1,
      });
      setEditingBrand(null);
      setBName('');
      setBOrder(String(brands.length + 1));
      flashStatus('Brand saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `brands/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'brands', id));
      flashStatus('Brand removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `brands/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await setDoc(
        doc(db, 'store', 'info'),
        {
          heroImages: storeDraft.heroImages.slice(0, 8),
          heroTitleEn: storeDraft.heroTitleEn.slice(0, 120),
          heroTitleAr: storeDraft.heroTitleAr.slice(0, 120),
          heroSubtitleEn: storeDraft.heroSubtitleEn.slice(0, 200),
          heroSubtitleAr: storeDraft.heroSubtitleAr.slice(0, 200),
          aboutEn: storeDraft.aboutEn.slice(0, 1500),
          aboutAr: storeDraft.aboutAr.slice(0, 1500),
          addressEn: storeDraft.addressEn.slice(0, 200),
          addressAr: storeDraft.addressAr.slice(0, 200),
          hoursEn: storeDraft.hoursEn.slice(0, 200),
          hoursAr: storeDraft.hoursAr.slice(0, 200),
          whatsappNumber: storeDraft.whatsappNumber.slice(0, 30),
          phoneDisplay: storeDraft.phoneDisplay.slice(0, 30),
          facebookUrl: storeDraft.facebookUrl.slice(0, 500),
          mapsEmbedUrl: storeDraft.mapsEmbedUrl.slice(0, 1000),
          mapsLinkUrl: storeDraft.mapsLinkUrl.slice(0, 1000),
          galleryImages: storeDraft.galleryImages.slice(0, 16),
          codeConfigured: true,
          catalogSeeded: true,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      flashStatus('Store details saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store/info');
    } finally {
      setBusy(false);
    }
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setErrorMsg('Codes must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('New codes do not match.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const cred = EmailAuthProvider.credential(
        ADMIN_EMAIL,
        currentPin + PASSCODE_SUFFIX,
      );
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPin + PASSCODE_SUFFIX);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      flashStatus('4-digit code updated.');
    } catch {
      setErrorMsg('Current code is incorrect.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Store Management"
    >
      <div className="bg-[#F5F3EF] w-full max-w-6xl h-full sm:h-[90vh] border border-[#111111] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#111111] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="London's Outlet"
              className="w-8 h-8 rounded-full border border-white/25 object-cover"
            />
            <span className="font-display text-lg font-bold uppercase tracking-wider">
              Store Manager
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 px-3 border border-white/25 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#C8312B] hover:border-[#C8312B] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 border border-white/25 flex items-center justify-center hover:bg-white hover:text-[#111111] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-[#111111]/15 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto shrink-0">
          {(
            [
              ['products', `Products (${products.length})`],
              ['categories', `Categories (${categories.length})`],
              ['brands', `Brands (${brands.length})`],
              ['store', 'Hero & Shop Info'],
              ['security', 'Change Code'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setErrorMsg('');
              }}
              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === id
                  ? 'border-[#C8312B] text-[#111111]'
                  : 'border-transparent text-[#2B2B2B]/70 hover:text-[#111111]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Feedback Banner */}
        {(statusMsg || errorMsg) && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shrink-0 ${
              errorMsg ? 'bg-[#C8312B] text-white' : 'bg-[#1C2A52] text-white'
            }`}
          >
            {statusMsg && <Check className="w-4 h-4" />}
            <span>{errorMsg || statusMsg}</span>
          </div>
        )}

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-bold uppercase text-[#111111]">
                  Catalog Inventory
                </h3>
                <button
                  type="button"
                  onClick={openNewProductForm}
                  className="h-10 px-4 bg-[#C8312B] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#111111] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {showProductForm && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-white border border-[#111111] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
                    <h4 className="font-display text-lg font-bold uppercase">
                      {editingProduct ? 'Edit Product' : 'New Product'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="text-xs font-semibold uppercase text-[#2B2B2B] hover:text-[#C8312B] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Name (English) *
                      </label>
                      <input
                        required
                        value={pNameEn}
                        onChange={(e) => setPNameEn(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Name (Arabic)
                      </label>
                      <input
                        dir="rtl"
                        value={pNameAr}
                        onChange={(e) => setPNameAr(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Brand *
                      </label>
                      <input
                        required
                        list="brand-options"
                        value={pBrand}
                        onChange={(e) => setPBrand(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                      <datalist id="brand-options">
                        {brands.map((b) => (
                          <option key={b.id} value={b.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Category *
                      </label>
                      <select
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Price (USD) *
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={pPrice}
                        onChange={(e) => setPPrice(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Old Price (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pOldPrice}
                        onChange={(e) => setPOldPrice(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Sizes (comma separated)
                      </label>
                      <input
                        value={pSizes}
                        onChange={(e) => setPSizes(e.target.value)}
                        placeholder="S, M, L, XL"
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Colors (comma separated)
                      </label>
                      <input
                        value={pColors}
                        onChange={(e) => setPColors(e.target.value)}
                        placeholder="Black, Navy"
                        className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Description (English)
                      </label>
                      <textarea
                        rows={2}
                        value={pDescEn}
                        onChange={(e) => setPDescEn(e.target.value)}
                        className="w-full p-2.5 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1">
                        Description (Arabic)
                      </label>
                      <textarea
                        dir="rtl"
                        rows={2}
                        value={pDescAr}
                        onChange={(e) => setPDescAr(e.target.value)}
                        className="w-full p-2.5 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pInStock}
                        onChange={(e) => setPInStock(e.target.checked)}
                        className="w-4 h-4 accent-[#111111]"
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pIsNew}
                        onChange={(e) => setPIsNew(e.target.checked)}
                        className="w-4 h-4 accent-[#111111]"
                      />
                      <span>New Arrival</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pIsSale}
                        onChange={(e) => setPIsSale(e.target.checked)}
                        className="w-4 h-4 accent-[#C8312B]"
                      />
                      <span>On Sale</span>
                    </label>
                  </div>

                  {/* Product Images */}
                  <div className="space-y-2 border-t border-[#111111]/10 pt-3">
                    <span className="block text-xs font-semibold uppercase">
                      Images ({pImages.length}/8)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="h-10 px-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#C8312B]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProductImageUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        value={pImageUrlInput}
                        onChange={(e) => setPImageUrlInput(e.target.value)}
                        placeholder="Or paste image URL..."
                        className="flex-1 min-w-[200px] h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!pImageUrlInput.trim()) return;
                          setPImages((prev) =>
                            [...prev, pImageUrlInput.trim()].slice(0, 8),
                          );
                          setPImageUrlInput('');
                        }}
                        className="h-10 px-4 border border-[#111111] text-xs font-semibold uppercase cursor-pointer hover:bg-[#111111] hover:text-white"
                      >
                        Add URL
                      </button>
                    </div>

                    {pImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {pImages.map((img, i) => (
                          <div
                            key={`${img}-${i}`}
                            className="relative w-20 h-20 border border-[#111111]/20 bg-[#ECE8E1]"
                          >
                            <ResilientImage
                              src={img}
                              alt={`Preview ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPImages((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="absolute -top-2 -end-2 w-6 h-6 bg-[#C8312B] text-white flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-11 px-6 bg-[#C8312B] text-white font-display text-sm font-bold uppercase tracking-wider hover:bg-[#111111] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[#111111]/15 p-3.5 flex gap-3.5 items-center"
                  >
                    <div className="w-20 h-20 shrink-0 bg-[#ECE8E1] overflow-hidden">
                      <ResilientImage
                        src={p.images[0]}
                        alt={p.nameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase text-[#2B2B2B]/65">
                        {p.brand} · {p.category}
                      </p>
                      <p className="font-semibold text-sm text-[#111111] truncate">
                        {p.nameEn}
                      </p>
                      <p className="text-xs font-bold tabular-nums mt-0.5">
                        ${p.priceUsd}{' '}
                        {!p.inStock && (
                          <span className="text-[#C8312B]">(Sold Out)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => openEditProductForm(p)}
                          className="h-8 px-2.5 border border-[#111111]/20 text-xs font-semibold flex items-center gap-1 hover:bg-[#111111] hover:text-white cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="h-8 px-2.5 border border-[#C8312B]/30 text-[#C8312B] text-xs font-semibold flex items-center gap-1 hover:bg-[#C8312B] hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveCategory}
                className="bg-white border border-[#111111]/20 p-5 space-y-4"
              >
                <h3 className="font-display text-lg font-bold uppercase">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    required
                    placeholder="Name (English)"
                    value={cNameEn}
                    onChange={(e) => setCNameEn(e.target.value)}
                    className="h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                  />
                  <input
                    dir="rtl"
                    placeholder="Name (Arabic)"
                    value={cNameAr}
                    onChange={(e) => setCNameAr(e.target.value)}
                    className="h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Sort Order"
                    value={cOrder}
                    onChange={(e) => setCOrder(e.target.value)}
                    className="h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                  />
                  <div className="flex gap-2">
                    <input
                      required
                      placeholder="Image URL"
                      value={cImage}
                      onChange={(e) => setCImage(e.target.value)}
                      className="flex-1 h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                    <label className="h-10 px-3 bg-[#111111] text-white text-xs font-semibold flex items-center cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusy(true);
                          try {
                            const url = await uploadImageAsset(file, 'categories');
                            setCImage(url);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-10 px-5 bg-[#C8312B] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCNameEn('');
                        setCNameAr('');
                        setCImage('');
                      }}
                      className="h-10 px-4 border border-[#111111]/20 text-xs font-semibold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#111111]/15 p-3.5 flex items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-[#ECE8E1] shrink-0 overflow-hidden">
                      <ResilientImage
                        src={c.image}
                        alt={c.nameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.nameEn}</p>
                      <p className="text-xs text-[#2B2B2B]/70 truncate">{c.nameAr}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(c);
                            setCNameEn(c.nameEn);
                            setCNameAr(c.nameAr);
                            setCImage(c.image);
                            setCOrder(String(c.sortOrder));
                          }}
                          className="h-7 px-2 border border-[#111111]/20 text-xs font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id)}
                          className="h-7 px-2 border border-[#C8312B]/30 text-[#C8312B] text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BRANDS TAB */}
          {activeTab === 'brands' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveBrand}
                className="bg-white border border-[#111111]/20 p-5 flex flex-wrap items-end gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold uppercase mb-1">
                    Brand Name
                  </label>
                  <input
                    required
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="e.g. Nike"
                    className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-semibold uppercase mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={bOrder}
                    onChange={(e) => setBOrder(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="h-10 px-5 bg-[#C8312B] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {editingBrand ? 'Update Brand' : 'Add Brand'}
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {brands.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-[#111111]/15 p-3 flex items-center justify-between gap-2"
                  >
                    <span className="font-display font-bold uppercase truncate">
                      {b.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBrand(b);
                          setBName(b.name);
                          setBOrder(String(b.sortOrder));
                        }}
                        className="p-1.5 hover:bg-[#F5F3EF] cursor-pointer"
                        aria-label="Edit brand"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrand(b.id)}
                        className="p-1.5 text-[#C8312B] hover:bg-[#C8312B]/10 cursor-pointer"
                        aria-label="Delete brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STORE & HERO TAB */}
          {activeTab === 'store' && (
            <form onSubmit={handleSaveStoreInfo} className="space-y-6">
              <div className="bg-white border border-[#111111]/20 p-5 space-y-4">
                <h3 className="font-display text-lg font-bold uppercase">
                  Hero Images & Copy
                </h3>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <label className="h-10 px-4 bg-[#111111] text-white text-xs font-semibold uppercase inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Hero Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusy(true);
                          try {
                            const url = await uploadImageAsset(file, 'hero');
                            setStoreDraft((prev) => ({
                              ...prev,
                              heroImages: [...prev.heroImages, url].slice(0, 8),
                            }));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </label>
                    <input
                      value={heroUrlInput}
                      onChange={(e) => setHeroUrlInput(e.target.value)}
                      placeholder="Paste hero image URL..."
                      className="flex-1 min-w-[200px] h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!heroUrlInput.trim()) return;
                        setStoreDraft((prev) => ({
                          ...prev,
                          heroImages: [...prev.heroImages, heroUrlInput.trim()].slice(0, 8),
                        }));
                        setHeroUrlInput('');
                      }}
                      className="h-10 px-4 border border-[#111111] text-xs font-semibold uppercase cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {storeDraft.heroImages.map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        className="relative w-28 h-16 border border-[#111111]/20 bg-[#ECE8E1]"
                      >
                        <ResilientImage
                          src={img}
                          alt={`Hero ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setStoreDraft((prev) => ({
                              ...prev,
                              heroImages: prev.heroImages.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute -top-2 -end-2 w-6 h-6 bg-[#C8312B] text-white flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Hero Title (EN)
                    </label>
                    <input
                      value={storeDraft.heroTitleEn}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, heroTitleEn: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Hero Title (AR)
                    </label>
                    <input
                      dir="rtl"
                      value={storeDraft.heroTitleAr}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, heroTitleAr: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Subtitle (EN)
                    </label>
                    <input
                      value={storeDraft.heroSubtitleEn}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, heroSubtitleEn: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Subtitle (AR)
                    </label>
                    <input
                      dir="rtl"
                      value={storeDraft.heroSubtitleAr}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, heroSubtitleAr: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#111111]/20 p-5 space-y-4">
                <h3 className="font-display text-lg font-bold uppercase">
                  Shop Info, Contact & Maps
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      About (EN)
                    </label>
                    <textarea
                      rows={3}
                      value={storeDraft.aboutEn}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, aboutEn: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      About (AR)
                    </label>
                    <textarea
                      dir="rtl"
                      rows={3}
                      value={storeDraft.aboutAr}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, aboutAr: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Address (EN)
                    </label>
                    <input
                      value={storeDraft.addressEn}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, addressEn: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Address (AR)
                    </label>
                    <input
                      dir="rtl"
                      value={storeDraft.addressAr}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, addressAr: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Opening Hours (EN)
                    </label>
                    <input
                      value={storeDraft.hoursEn}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, hoursEn: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Opening Hours (AR)
                    </label>
                    <input
                      dir="rtl"
                      value={storeDraft.hoursAr}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, hoursAr: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      WhatsApp Number (digits w/ country code)
                    </label>
                    <input
                      value={storeDraft.whatsappNumber}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, whatsappNumber: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Phone Display
                    </label>
                    <input
                      value={storeDraft.phoneDisplay}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, phoneDisplay: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Facebook URL
                    </label>
                    <input
                      value={storeDraft.facebookUrl}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, facebookUrl: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Google Maps Link
                    </label>
                    <input
                      value={storeDraft.mapsLinkUrl}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, mapsLinkUrl: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase mb-1">
                      Google Maps Embed URL
                    </label>
                    <input
                      value={storeDraft.mapsEmbedUrl}
                      onChange={(e) =>
                        setStoreDraft((p) => ({ ...p, mapsEmbedUrl: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#111111]/20 p-5 space-y-3">
                <h3 className="font-display text-lg font-bold uppercase">
                  Gallery Images ({storeDraft.galleryImages.length}/16)
                </h3>
                <div className="flex flex-wrap gap-2">
                  <label className="h-10 px-4 bg-[#111111] text-white text-xs font-semibold uppercase inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusy(true);
                        try {
                          const url = await uploadImageAsset(file, 'gallery');
                          setStoreDraft((prev) => ({
                            ...prev,
                            galleryImages: [...prev.galleryImages, url].slice(0, 16),
                          }));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </label>
                  <input
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    placeholder="Paste gallery image URL..."
                    className="flex-1 min-w-[200px] h-10 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!galleryUrlInput.trim()) return;
                      setStoreDraft((prev) => ({
                        ...prev,
                        galleryImages: [
                          ...prev.galleryImages,
                          galleryUrlInput.trim(),
                        ].slice(0, 16),
                      }));
                      setGalleryUrlInput('');
                    }}
                    className="h-10 px-4 border border-[#111111] text-xs font-semibold uppercase cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {storeDraft.galleryImages.map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="relative w-20 h-20 border border-[#111111]/20 bg-[#ECE8E1]"
                    >
                      <ResilientImage
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setStoreDraft((prev) => ({
                            ...prev,
                            galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute -top-2 -end-2 w-6 h-6 bg-[#C8312B] text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="h-12 px-8 bg-[#C8312B] text-white font-display text-sm font-bold uppercase tracking-wider hover:bg-[#111111] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Saving...' : 'Save Store Configuration'}
              </button>
            </form>
          )}

          {/* CHANGE CODE TAB */}
          {activeTab === 'security' && (
            <form
              onSubmit={handleChangeCode}
              className="bg-white border border-[#111111]/20 p-6 max-w-md space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#C8312B]" />
                <h3 className="font-display text-xl font-bold uppercase">
                  Change 4-Digit Code
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Current 4-Digit Code
                </label>
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-base tracking-[0.5em]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  New 4-Digit Code
                </label>
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-base tracking-[0.5em]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Confirm New 4-Digit Code
                </label>
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/20 text-base tracking-[0.5em]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="h-11 px-6 bg-[#111111] text-white font-display text-sm font-bold uppercase tracking-wider hover:bg-[#C8312B] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Updating...' : 'Update Code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
