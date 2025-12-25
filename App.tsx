
import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Calendar, User, LogOut, Lock, Briefcase, Shield, Search, ArrowRight, Eye, EyeOff, CheckCircle, MessageCircle, Plus, Key, Sparkles } from 'lucide-react';
import { Worker, Booking, UserRole, Consumer, Category, Review, Feedback } from './types';
import { WORKERS, CATEGORIES as INITIAL_CATEGORIES, REVIEWS as INITIAL_REVIEWS_DATA } from './data';
import { HomeView, CategoryView, ProfileView, BookingsView, ChatsView } from './components/Views';
import { BookingModal } from './components/BookingModal';
import { AIChat } from './components/AIChat';
import { AdminPortal } from './components/AdminPortal';
import { WorkerPortal } from './components/WorkerPortal';
import { LiveVoiceAssistant } from './components/LiveVoiceAssistant';

type ViewState = 'home' | 'category' | 'profile' | 'bookings' | 'chats';

const STORAGE_KEYS = {
  WORKERS: 'thekedaar_workers',
  SESSION: 'thekedaar_session',
  CONSUMERS: 'thekedaar_consumers',
  BOOKINGS: 'thekedaar_bookings',
  CATEGORIES: 'thekedaar_categories',
  REVIEWS: 'thekedaar_reviews',
  FEEDBACKS: 'thekedaar_feedbacks'
};

const INITIAL_CONSUMERS: Consumer[] = [];

export default function App() {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('CONSUMER');
  const [currentLoggedInWorker, setCurrentLoggedInWorker] = useState<Worker | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') as 'light' | 'dark' || 'light');
  
  const initialWorkers = Object.values(WORKERS).flat();
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const savedWorkers = localStorage.getItem(STORAGE_KEYS.WORKERS);
      return savedWorkers ? JSON.parse(savedWorkers) : initialWorkers;
    } catch (e) {
      return initialWorkers;
    }
  });

  const [consumers, setConsumers] = useState<Consumer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONSUMERS);
      return saved ? JSON.parse(saved) : INITIAL_CONSUMERS;
    } catch (e) {
      return INITIAL_CONSUMERS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers)); }, [workers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONSUMERS, JSON.stringify(consumers)); }, [consumers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks)); }, [feedbacks]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) {
        const { role, workerId } = JSON.parse(session);
        if (role) {
          setCurrentUserRole(role);
          setShowWelcomeScreen(false);
          if (role === 'WORKER' && workerId) {
            const worker = workers.find(w => w.id === workerId);
            if (worker) setCurrentLoggedInWorker(worker);
          }
        }
      }
    } catch (e) {}
  }, []); 

  const [view, setView] = useState<ViewState>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLiveAssistant, setShowLiveAssistant] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTarget, setLoginTarget] = useState<'ADMIN' | 'WORKER' | 'CONSUMER'>('ADMIN');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfession, setRegProfession] = useState('Plumber');
  const [regPass, setRegPass] = useState('');
  const [regEmail, setRegEmail] = useState(''); 
  const [regPhoto, setRegPhoto] = useState<string>('👷'); 
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Bhilai, Chhattisgarh');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginTarget === 'ADMIN') {
        if (loginId.toLowerCase() === 'admin' && loginPass === 'admin123') {
            setCurrentUserRole('ADMIN');
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ role: 'ADMIN' }));
            setShowWelcomeScreen(false);
            setShowLoginModal(false);
        } else setLoginError('Invalid Admin ID or Password');
        return;
    }
    if (loginTarget === 'CONSUMER') {
      const consumer = consumers.find(c => c.email.toLowerCase() === loginId.toLowerCase());
      if (consumer) {
        if (consumer.password && consumer.password !== loginPass) { setLoginError('Invalid Password'); return; }
        setCurrentUserRole('CONSUMER');
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ role: 'CONSUMER' }));
        setShowLoginModal(false);
        setShowWelcomeScreen(false);
      } else setLoginError('Email not found. Please register.');
      return;
    }
    if (loginTarget === 'WORKER') {
       const workerMatch = workers.find(w => w.id.toString() === loginId || w.phone === loginId);
       if (workerMatch && (workerMatch.password || '123') === loginPass) {
          setCurrentUserRole('WORKER');
          setCurrentLoggedInWorker(workerMatch);
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ role: 'WORKER', workerId: workerMatch.id }));
          setShowLoginModal(false);
          setShowWelcomeScreen(false);
       } else setLoginError('Invalid Worker ID or Password');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginTarget === 'CONSUMER') {
      const newConsumer: Consumer = { id: Date.now().toString(), name: regName, email: regEmail, phone: regPhone, joinDate: new Date().toISOString().split('T')[0], status: 'Active', password: regPass };
      setConsumers([...consumers, newConsumer]);
      setCurrentUserRole('CONSUMER');
      setShowLoginModal(false);
      setShowWelcomeScreen(false);
    } else if (loginTarget === 'WORKER') {
      const newId = Math.floor(100000 + Math.random() * 900000); 
      setWorkers([...workers, { id: newId, name: regName, profession: regProfession, phone: regPhone, password: regPass, photo: regPhoto, experience: '0 years', area: 'Bhilai', rating: 5.0, totalReviews: 0, additionalServices: [], description: 'New partner.', hourlyRate: 300, verified: false, responseTime: '1 hour', completedJobs: 0, portfolio: [] }]);
      setGeneratedId(newId.toString());
    }
  };

  const handleLogout = () => {
    setCurrentUserRole('CONSUMER');
    setCurrentLoggedInWorker(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setView('home');
    setShowWelcomeScreen(true);
  };

  const handleBookingConfirm = (date: string, time: string) => {
    const worker = selectedWorker || workers[0];
    const newBooking: Booking = { id: Date.now().toString(), workerId: worker.id, workerName: worker.name, date, time, service: worker.profession, status: 'CONFIRMED', amount: worker.hourlyRate };
    setBookings([newBooking, ...bookings]);
    setShowBookingModal(false);
    setShowLiveAssistant(false);
    setView('bookings');
  };

  if (currentUserRole === 'ADMIN') return <AdminPortal workers={workers} setWorkers={setWorkers} bookings={bookings} setBookings={setBookings} consumers={consumers} setConsumers={setConsumers} categories={categories} setCategories={setCategories} reviews={reviews} setReviews={setReviews} feedbacks={feedbacks} setFeedbacks={setFeedbacks} onLogout={handleLogout} />;
  if (currentUserRole === 'WORKER') return currentLoggedInWorker ? <WorkerPortal worker={currentLoggedInWorker} onLogout={handleLogout} onUpdateWorker={(w) => { setWorkers(workers.map(x => x.id === w.id ? w : x)); setCurrentLoggedInWorker(w); }} /> : <div />;

  if (showWelcomeScreen) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
        <button onClick={toggleTheme} className="absolute top-4 right-4 z-50 p-3 bg-white/20 backdrop-blur-md rounded-full text-white">{theme === 'light' ? '🌙' : '☀️'}</button>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-orange-500 to-red-600 rounded-b-[3rem] z-0"></div>
        <div className="relative z-10 w-full max-w-5xl">
          <div className="text-center text-white mb-12">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-orange-600 font-bold text-4xl shadow-2xl mx-auto mb-6">T</div>
            <h1 className="text-4xl font-bold mb-2">Welcome to Thekedaar</h1>
            <p className="text-lg opacity-90">Premium Home Services & AI Solutions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl hover:-translate-y-1 transition-all group border dark:border-gray-700">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Search className="w-7 h-7" /></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Book a Service</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Find trusted professionals instantly.</p>
              <button onClick={() => { setShowWelcomeScreen(false); setCurrentUserRole('CONSUMER'); }} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">Enter as Guest <ArrowRight className="w-4 h-4" /></button>
            </div>
            <button onClick={() => { setLoginTarget('WORKER'); setShowLoginModal(true); setIsRegistering(false); }} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl hover:-translate-y-1 transition-all group border dark:border-gray-700">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6"><Briefcase className="w-7 h-7" /></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Service Partner</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your jobs and earnings.</p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold">Partner Portal <ArrowRight className="w-4 h-4 ml-1" /></div>
            </button>
            <button onClick={() => { setLoginTarget('ADMIN'); setShowLoginModal(true); setIsRegistering(false); }} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl hover:-translate-y-1 transition-all group border dark:border-gray-700">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl flex items-center justify-center mb-6"><Shield className="w-7 h-7" /></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Admin Portal</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">System administration and reports.</p>
              <div className="flex items-center text-gray-700 dark:text-gray-300 font-bold">Admin Login <ArrowRight className="w-4 h-4 ml-1" /></div>
            </button>
          </div>
        </div>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 relative z-10 animate-in zoom-in-95 duration-200">
                <button onClick={() => setShowLoginModal(false)} className="absolute right-4 top-4 text-gray-400"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{isRegistering ? 'Registration' : 'Login'}</h2>
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                  {isRegistering ? (
                    <>
                      <input type="text" placeholder="Full Name" required className="w-full p-3 border dark:bg-gray-700 rounded-xl" value={regName} onChange={e => setRegName(e.target.value)} />
                      <input type="tel" placeholder="Phone Number" required className="w-full p-3 border dark:bg-gray-700 rounded-xl" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                      <input type="password" placeholder="Create Password" required className="w-full p-3 border dark:bg-gray-700 rounded-xl" value={regPass} onChange={e => setRegPass(e.target.value)} />
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Register Now</button>
                    </>
                  ) : (
                    <>
                      <input type="text" placeholder="ID or Phone" className="w-full p-3 border dark:bg-gray-700 rounded-xl" value={loginId} onChange={e => setLoginId(e.target.value)} />
                      <input type="password" placeholder="Password" className="w-full p-3 border dark:bg-gray-700 rounded-xl" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Login</button>
                    </>
                  )}
                  {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                  <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-sm text-gray-500">{isRegistering ? 'Have an account? Login' : "Don't have an account? Sign Up"}</button>
                </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
             <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200 dark:shadow-none">T</div>
             <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Thekedaar</h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleTheme} className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">{theme === 'light' ? '🌙' : '☀️'}</button>
             <button onClick={() => setView('bookings')} className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"><Calendar className="w-5 h-5" /></button>
             <button onClick={handleLogout} className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {view === 'home' && <HomeView categories={categories} workers={workers} onCategorySelect={(id) => { setSelectedCategory(id); setView('category'); }} searchTerm={searchTerm} setSearchTerm={setSearchTerm} location={location} setLocation={setLocation} onSendFeedback={(f) => setFeedbacks([...feedbacks, f])} />}
        {view === 'category' && <CategoryView category={selectedCategory!} workers={workers.filter(w => w.profession === categories.find(c => c.id === selectedCategory)?.name)} onBack={() => setView('home')} onWorkerSelect={(w) => { setSelectedWorker(w); setView('profile'); }} categories={categories} />}
        {view === 'profile' && <ProfileView worker={selectedWorker!} onBack={() => setView('category')} onBook={() => setShowBookingModal(true)} allReviews={reviews} />}
        {view === 'bookings' && <BookingsView bookings={bookings} onGoHome={() => setView('home')} onLeaveReview={(bid, wid, r, c) => { setReviews([...reviews, { id: Date.now().toString(), customerName: 'User', rating: r, comment: c, date: 'Today', verified: true, workerId: wid }]); }} />}
      </main>
      
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)} />
           <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold dark:text-white">Book Service</h3>
                <button onClick={() => setShowBookingModal(false)}><X className="w-6 h-6 dark:text-white"/></button>
              </div>
              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => setShowLiveAssistant(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    <div className="text-left">
                      <p className="font-bold">Book via AI Assistant</p>
                      <p className="text-xs opacity-80">Instant voice scheduling</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="relative flex items-center justify-center py-2">
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase tracking-widest">or manual</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <BookingModal worker={selectedWorker!} onClose={() => setShowBookingModal(false)} onConfirm={handleBookingConfirm} />
              </div>
           </div>
        </div>
      )}
      
      {showLiveAssistant && <LiveVoiceAssistant worker={selectedWorker!} onClose={() => setShowLiveAssistant(false)} onBookingConfirmed={handleBookingConfirm} />}
      <AIChat />
    </div>
  );
}
