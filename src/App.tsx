import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Search as SearchIcon, 
  Compass, 
  LogIn, 
  LogOut, 
  BookOpen, 
  ChevronRight,
  Filter,
  Loader2,
  Book,
  User,
  Phone
} from 'lucide-react';
import { supabase, type Database } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Book = Database['public']['Tables']['books']['Row'];
type LibUser = Database['public']['Tables']['users']['Row'];

type View = 'home' | 'search' | 'explore';

export default function App() {
  const [view, setView] = useState<View>('home');

  return (
    <div className="min-h-screen bg-bg-deep text-text-main flex flex-col font-sans">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="h-20 border-b border-border-main flex items-center px-6 sm:px-10 bg-slate-900/50 backdrop-blur-md justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center font-bold text-white text-lg">
            GV
          </div>
          <h1 className="heading-serif text-lg font-bold sm:text-xl hidden md:block">
            Grameena Vayanasala Kondazhy
          </h1>
          <h1 className="heading-serif text-lg font-bold md:hidden">Vayanasala</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView('home')}
            className={cn("nav-pill", view === 'home' ? "nav-pill-active" : "nav-pill-inactive")}
          >
            Dashboard
          </button>
          <button 
            onClick={() => {
              setView('home');
              setTimeout(() => {
                document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className={cn("nav-pill", view === 'search' ? "nav-pill-active" : "nav-pill-inactive")}
          >
            Explore Catalog
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6 p-6">
        <aside className="space-y-6">
          <MemberAccess />
          
          <div className="card-github p-6 mt-auto">
            <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Library Hours</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mon - Sat</span>
                <span className="text-text-dim">08:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-text-dim">Closed</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <AnimatePresence mode="wait">
            {view === 'home' && <HomeView key="home" />}
            {view === 'search' && <SearchView key="search" />}
            {view === 'explore' && <ExploreView key="explore" />}
          </AnimatePresence>
        </section>
      </main>

      <footer className="py-6 text-center text-text-dim text-xs border-t border-border-main bg-bg-deep">
        <p>© {new Date().getFullYear()} Grameena Vayanasala Kondazhy Public Library</p>
      </footer>
    </div>
  );
}

function MemberAccess() {
  const [users, setUsers] = useState<LibUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [enteredPhone, setEnteredPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) console.error('Error fetching users:', error);
      else setUsers(data || []);
    }
    loadUsers();
  }, []);

  const handleEntry = async () => {
    if (!selectedUserId || !enteredPhone) return toast.error('Please select a member and enter phone number');
    
    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return toast.error('Member data error');
    
    // Check if phone matches (acting as password)
    if (targetUser.phone !== enteredPhone) {
      return toast.error('Incorrect phone number for the selected member');
    }

    setLoading(true);
    try {
      const { data: existingLog } = await supabase.from('library_logs').select('*').eq('phone', enteredPhone).is('out_time', null).maybeSingle();
      if (existingLog) return toast.error('Already inside!');

      const { error: logError } = await supabase.from('library_logs').insert({ 
        name: targetUser.name, 
        phone: enteredPhone, 
        in_time: new Date().toISOString() 
      });
      if (logError) throw logError;

      toast.success(`Welcome, ${targetUser.name}!`);
      setEnteredPhone('');
    } catch (err) {
      toast.error('Entry failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    if (!selectedUserId || !enteredPhone) return toast.error('Select member and enter phone');
    
    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return toast.error('Member data error');

    if (targetUser.phone !== enteredPhone) {
      return toast.error('Incorrect phone number');
    }

    setLoading(true);
    try {
      const { data: existingLog } = await supabase.from('library_logs').select('*').eq('phone', enteredPhone).is('out_time', null).maybeSingle();
      if (!existingLog) return toast.error('No active entry found.');

      const { error: updateError } = await supabase.from('library_logs').update({ out_time: new Date().toISOString() }).eq('id', existingLog.id);
      if (updateError) throw updateError;

      toast.success('Exit recorded.');
      setEnteredPhone('');
    } catch (err) {
      toast.error('Exit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-github p-6 flex flex-col gap-5">
      <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Member Access</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[12px] text-text-dim">Select Your Name</label>
          <select 
            className="w-full bg-bg-deep border border-border-main rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Choose Member</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] text-text-dim">Verify Phone (Password)</label>
          <input 
            type="password"
            placeholder="Enter registered mobile"
            className="w-full bg-bg-deep border border-border-main rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue placeholder:text-slate-700"
            value={enteredPhone}
            onChange={(e) => setEnteredPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            disabled={loading}
            onClick={handleEntry}
            className="bg-success-green hover:opacity-90 transition-opacity text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
          >
            LOG IN
          </button>
          <button 
            disabled={loading}
            onClick={handleExit}
            className="bg-error-red hover:opacity-90 transition-opacity text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
          >
            LOG OUT
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-main bg-accent-blue/5 border-dashed border rounded-lg p-3">
        <h4 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-3">Recently Active</h4>
        <div className="space-y-3">
          <ActiveLogItem name="Shaji P.V." time="10:24" />
          <ActiveLogItem name="Lakshmi Nair" time="09:45" />
          <ActiveLogItem name="Binu Kondazhy" time="11:12" />
        </div>
      </div>
    </div>
  );
}

function ActiveLogItem({ name, time }: { name: string; time: string }) {
  return (
    <div className="flex justify-between items-center text-[12px]">
      <span className="text-text-main">{name}</span>
      <span className="text-success-green flex items-center gap-1.5 font-medium">
        <span className="w-1.5 h-1.5 bg-success-green rounded-full shadow-[0_0_5px_rgba(35,134,54,0.5)]"></span>
        {time}
      </span>
    </div>
  );
}

function HomeView() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="card-github p-10 text-center space-y-4 bg-gradient-to-br from-accent-blue/5 to-transparent">
        <h2 className="text-4xl heading-serif font-bold text-text-main">
          Library Dashboard
        </h2>
        <p className="text-text-dim max-w-2xl mx-auto">
          Welcome to the digital OPAC of Grameena Vayanasala Kondazhy. 
          Use the catalog tools to find resources or check your membership status.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem value="12,452" label="Total Collection" />
        <StatItem value="842" label="Active Members" />
        <StatItem value="14" label="Visitors Today" />
        <StatItem value="Connected" label="Supabase System" highlight />
      </div>

      <div id="catalog-anchor" className="scroll-mt-24" />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-github p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-blue" />
            New Arrivals
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-3 border-b border-border-main">
                <span className="text-sm font-medium">Aarachar</span>
                <span className="text-xs text-text-dim">K.R. Meera</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-border-main">
                <span className="text-sm font-medium">Randamoozham</span>
                <span className="text-xs text-text-dim">M.T. Vasudevan Nair</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Oru Desathinte Katha</span>
                <span className="text-xs text-text-dim">S.K. Pottekkatt</span>
             </div>
          </div>
        </div>
        <div className="card-github p-6">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-accent-blue" />
            About Library
          </h3>
          <div className="text-sm text-text-dim space-y-3">
             <p>Grameena Vayanasala Kondazhy is a community library dedicated to promoting knowledge and literacy in rural Kerala.</p>
             <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-3 bg-bg-deep border border-border-main rounded-lg text-center">
                  <span className="block text-xs font-bold text-accent-blue">A+ GRADE</span>
                  <span className="text-[10px] uppercase">Rating</span>
                </div>
                <div className="p-3 bg-bg-deep border border-border-main rounded-lg text-center">
                  <span className="block text-xs font-bold text-accent-blue">SINCE 1954</span>
                  <span className="text-[10px] uppercase">Est.</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-8 space-y-4">
        <h3 className="text-2xl heading-serif font-bold flex items-center gap-3">
          <Library className="w-6 h-6 text-accent-blue" />
          Explore Collection
        </h3>
        <CatalogExplorer />
      </div>
    </motion.div>
  );
}

function CatalogExplorer() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'title' | 'author' | 'stocknumber'>('title');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageSize = 12;

  const performFetch = async (isLoadMore = false) => {
    setLoading(true);
    const currentPage = isLoadMore ? page + 1 : 0;
    
    let q = supabase.from('books').select('*', { count: 'exact' });
    
    if (search.trim()) {
      q = q.ilike(type, `%${search}%`);
    }
    
    if (category !== 'all') {
      q = q.eq('category', category);
    }

    const { data, count, error } = await q
      .order('title')
      .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

    if (error) {
      toast.error('Failed to load books');
    } else {
      const newBooks = data || [];
      if (isLoadMore) {
        setBooks(prev => [...prev, ...newBooks]);
      } else {
        setBooks(newBooks);
      }
      setPage(currentPage);
      setHasMore(newBooks.length === pageSize);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performFetch();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, type, category]);

  return (
    <div className="space-y-6">
      <div className="card-github p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Search Catalog</label>
          <div className="relative">
            <input 
              placeholder="Search by title, author, or stock number..."
              className="w-full bg-bg-deep border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-accent-blue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-text-dim" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">By Field</label>
          <select 
            className="w-full bg-bg-deep border border-border-main rounded-xl px-4 py-2.5 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="stocknumber">Stock Number</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Category Filter</label>
          <select 
            className="w-full bg-bg-deep border border-border-main rounded-xl px-4 py-2.5 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Fiction">Fiction</option>
            <option value="History">History</option>
            <option value="Literature">Literature</option>
            <option value="Classic">Classic</option>
            <option value="Poetry">Poetry</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.map((book) => (
          <BookGridCard key={book.id} book={book} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-4 pb-12">
          <button 
            onClick={() => performFetch(true)}
            className="px-8 py-3 bg-bg-card border border-border-main rounded-full text-sm font-semibold hover:border-accent-blue transition-all flex items-center gap-2"
          >
            Load More Books
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>
      )}
      
      {!hasMore && books.length > 0 && (
        <div className="text-center py-8 text-sm text-text-dim">
          Reached end of collection.
        </div>
      )}
    </div>
  );
}

function StatItem({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="card-github p-5 flex flex-col">
      <span className={cn("text-2xl font-bold", highlight && "text-accent-blue")}>{value}</span>
      <span className="text-[10px] text-text-dim uppercase font-semibold tracking-wider mt-1">{label}</span>
    </div>
  );
}

function SearchView() {
  return (
    <div className="card-github p-12 text-center space-y-4">
       <Library className="w-12 h-12 text-accent-blue mx-auto opacity-50" />
       <h2 className="text-2xl font-bold">Integrated Catalog</h2>
       <p className="text-text-dim">The catalog is now integrated directly into the dashboard for a smoother experience. Scroll down on the Dashboard to browse all books.</p>
       <button 
        onClick={() => {
           const element = document.getElementById('catalog-anchor');
           element?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="nav-pill nav-pill-active inline-flex"
       >
         Go to Collection
       </button>
    </div>
  );
}

function ExploreView() {
  return <SearchView />;
}

const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  return (
    <div className="card-github p-4 flex flex-col gap-2 hover:border-text-dim transition-colors cursor-default group">
      <span className="text-[10px] font-mono text-accent-blue uppercase font-bold tracking-tighter">BK-{book.stocknumber}</span>
      <h3 className="heading-serif font-bold text-base group-hover:text-accent-blue transition-colors line-clamp-1">{book.title}</h3>
      <div className="flex justify-between items-center text-[12px] text-text-dim">
        <span>{book.author}</span>
        <span className="px-2 py-0.5 rounded border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-[10px] font-bold">{book.category || 'General'}</span>
      </div>
    </div>
  );
}

const BookGridCard: React.FC<{ book: Book }> = ({ book }) => {
  return (
    <div className="card-github p-5 flex flex-col gap-3 group">
      <div className="flex justify-between">
        <span className="text-[11px] font-mono text-accent-blue font-bold tracking-tight">BK-ID: {book.stocknumber}</span>
        {book.shelfnumber && <span className="text-[10px] text-text-dim uppercase tracking-wider">Shelf {book.shelfnumber}</span>}
      </div>
      <h3 className="heading-serif font-bold text-lg leading-snug line-clamp-2 min-h-[50px]">{book.title}</h3>
      <div className="space-y-1">
        <p className="text-xs text-text-dim">{book.author}</p>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-main text-text-dim font-semibold uppercase">{book.category || 'N/A'}</span>
          {book.language && <span className="text-[10px] text-accent-blue">{book.language}</span>}
        </div>
      </div>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
