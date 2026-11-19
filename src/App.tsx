import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STORE_INFO,
} from './data/defaults';
import { Brand, Category, Language, PriceRange, Product, StoreInfo } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoriesSection } from './components/CategoriesSection';
import { NewAndSaleSection } from './components/NewAndSaleSection';
import { ProductCatalog } from './components/ProductCatalog';
import { BrandsStrip } from './components/BrandsStrip';
import { AboutMapSection } from './components/AboutMapSection';
import { GalleryContactSection } from './components/GalleryContactSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PinGateModal } from './components/PinGateModal';
import { StoreManagerPanel } from './components/StoreManagerPanel';

const LANG_KEY = 'lo_lang';
const WISHLIST_KEY = 'lo_wishlist';

function Storefront() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'ar' ? 'ar' : 'en';
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  // Live Firestore state
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [fsProducts, setFsProducts] = useState<Product[] | null>(null);
  const [fsCategories, setFsCategories] = useState<Category[] | null>(null);
  const [fsBrands, setFsBrands] = useState<Brand[] | null>(null);

  // Auth & Management Modals
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  // Catalog Filters & Detail Modal
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Sync HTML dir & lang
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const ok = Boolean(user && user.email === ADMIN_EMAIL);
      setIsAuthorized(ok);
      if (!ok) {
        setManagerOpen(false);
      }
    });
    return () => unsub();
  }, []);

  // Firestore listeners (public read)
  useEffect(() => {
    const unsubStore = onSnapshot(
      doc(db, 'store', 'info'),
      (snap) => {
        if (snap.exists()) {
          setStoreInfo({
            ...DEFAULT_STORE_INFO,
            ...(snap.data() as Partial<StoreInfo>),
          });
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'store/info');
      },
    );

    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), orderBy('sortOrder', 'asc')),
      (snap) => {
        const items: Category[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, 'id'>),
        }));
        setFsCategories(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'categories');
      },
    );

    const unsubBrands = onSnapshot(
      query(collection(db, 'brands'), orderBy('sortOrder', 'asc')),
      (snap) => {
        const items: Brand[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Brand, 'id'>),
        }));
        setFsBrands(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'brands');
      },
    );

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('sortOrder', 'asc')),
      (snap) => {
        const items: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        setFsProducts(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      },
    );

    return () => {
      unsubStore();
      unsubCats();
      unsubBrands();
      unsubProducts();
    };
  }, []);

  // Use starter catalog until Firestore has been seeded at least once
  const categories =
    fsCategories && (fsCategories.length > 0 || storeInfo.catalogSeeded)
      ? fsCategories
      : DEFAULT_CATEGORIES;

  const brands =
    fsBrands && (fsBrands.length > 0 || storeInfo.catalogSeeded)
      ? fsBrands
      : DEFAULT_BRANDS;

  const products =
    fsProducts && (fsProducts.length > 0 || storeInfo.catalogSeeded)
      ? fsProducts
      : DEFAULT_PRODUCTS;

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategoryCard = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setWishlistOnly(false);
    scrollToCatalog();
  };

  const handleSelectBrandStrip = (brandName: string) => {
    setSelectedBrand(brandName);
    setWishlistOnly(false);
    scrollToCatalog();
  };

  const handleToggleWishlistNavbar = () => {
    setWishlistOnly((prev) => {
      const next = !prev;
      if (next) {
        scrollToCatalog();
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedSize('all');
    setPriceRange('all');
    setWishlistOnly(false);
  };

  const handleSecretLogoTrigger = () => {
    if (isAuthorized) {
      setManagerOpen(true);
    } else {
      setPinModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EF] text-[#111111]">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
        wishlistCount={wishlist.length}
        wishlistFilterActive={wishlistOnly}
        onToggleWishlistView={handleToggleWishlistNavbar}
        onSecretLogoTrigger={handleSecretLogoTrigger}
      />

      <main className="flex-1">
        <Hero lang={lang} storeInfo={storeInfo} />

        <CategoriesSection
          lang={lang}
          categories={categories}
          onSelectCategory={handleSelectCategoryCard}
        />

        <NewAndSaleSection
          lang={lang}
          products={products}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          onSelectProduct={setActiveProduct}
        />

        <ProductCatalog
          lang={lang}
          products={products}
          categories={categories}
          brands={brands}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          wishlistOnly={wishlistOnly}
          onToggleWishlistOnly={() => setWishlistOnly((v) => !v)}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          onResetFilters={resetFilters}
          onSelectProduct={setActiveProduct}
        />

        <BrandsStrip
          lang={lang}
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={handleSelectBrandStrip}
        />

        <AboutMapSection lang={lang} storeInfo={storeInfo} />

        <GalleryContactSection lang={lang} storeInfo={storeInfo} />
      </main>

      <Footer lang={lang} storeInfo={storeInfo} />

      <FloatingWhatsApp lang={lang} whatsappNumber={storeInfo.whatsappNumber} />

      <ProductDetailModal
        lang={lang}
        product={activeProduct}
        whatsappNumber={storeInfo.whatsappNumber}
        isSaved={activeProduct ? wishlist.includes(activeProduct.id) : false}
        onToggleWishlist={toggleWishlist}
        onClose={() => setActiveProduct(null)}
      />

      <PinGateModal
        open={pinModalOpen}
        storeInfo={storeInfo}
        onClose={() => setPinModalOpen(false)}
        onAuthenticated={() => {
          setPinModalOpen(false);
          setManagerOpen(true);
        }}
      />

      <StoreManagerPanel
        open={managerOpen && isAuthorized}
        products={products}
        categories={categories}
        brands={brands}
        storeInfo={storeInfo}
        onClose={() => setManagerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Storefront />
    </ErrorBoundary>
  );
}
