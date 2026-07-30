import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import 'locomotive-scroll/dist/locomotive-scroll.css';
import NewsCard from '../components/NewsCard';
import SubscriptionSection from '../components/SubscriptionSection';
import UrgentRequirementSection from '../components/UrgentRequirement';
import Footer from '../components/Footer';
import MarketDataChart from '../components/MarketDataChart';
import { EncryptedText } from '../components/EncryptedText';
import { mockNews, mockTenders } from '../data/mockData';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './Home.css';

const Home = () => {
  const [featuredNews, setFeaturedNews] = React.useState(mockNews[0]);
  const [regularNews, setRegularNews] = React.useState(mockNews.slice(1, 4));
  const [tenders, setTenders] = React.useState(mockTenders);
  const containerRef = useRef(null);

  React.useEffect(() => {
    // Fetch data from Firebase
    const fetchData = async () => {
      try {
        const newsSnap = await getDocs(query(collection(db, 'news'), limit(4)));
        if (!newsSnap.empty) {
          const newsData = newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFeaturedNews(newsData[0]);
          setRegularNews(newsData.slice(1, 4));
        }

        const tendersSnap = await getDocs(query(collection(db, 'tenders'), limit(5)));
        if (!tendersSnap.empty) {
          const tendersData = tendersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTenders(tendersData);
        }
      } catch (error) {
        console.warn("Firebase not configured yet or error fetching data. Falling back to mockData.", error);
      }
    };
    
    fetchData();
  }, []);

  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let scroller;
    let initTimer;
    
    (async () => {
      const LocomotiveScroll = (await import('locomotive-scroll')).default;
      initTimer = setTimeout(() => {
        if (!containerRef.current) return;
        
        scroller = new LocomotiveScroll({
          el: containerRef.current,
          smooth: true
        });

      scroller.on("scroll", ScrollTrigger.update);

      ScrollTrigger.scrollerProxy(containerRef.current, {
        scrollTop(value) {
          return arguments.length
            ? scroller.scrollTo(value, 0, 0)
            : scroller.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
          return {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight
          };
        },
        pinType: containerRef.current.style.transform ? "transform" : "fixed"
      });

      ScrollTrigger.addEventListener("refresh", () => scroller && scroller.update());
      ScrollTrigger.refresh();

      /* COLOR CHANGER REMOVED */
      // The user requested removing the scroll white to black effect.
      }, 100);
    })();

    return () => {
      clearTimeout(initTimer);
      if (scroller) scroller.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.to("body", { backgroundColor: "", color: "" });
    };
  }, []);

  return (
    <div className="home-page" ref={containerRef} data-scroll-container>
      {/* Hero Section */}
      <section className="hero-section container" data-scroll-section>
        <div className="hero-content">
          <span className="hero-badge">LIVE INTELLIGENCE</span>
          <h1 className="hero-title animate-fade-in">
            The Middle East's<br />
            <span className="text-accent">
              <EncryptedText 
                text="Project Intelligence" 
                encryptedClassName="text-neutral-400" 
                revealedClassName="text-accent" 
                revealDelayMs={15} 
              />
            </span>
          </h1>
          <p className="hero-desc animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Exclusive tender data, EPC contract awards, and strategic project intelligence
            across the GCC, MENA, and global energy markets — delivered daily.
          </p>
          <Link to="/projects" className="primary-btn animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Explore Projects <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Urgent Requirement Section */}
      <UrgentRequirementSection />

      {/* Top News Section */}
      <section className="top-news-section container" data-scroll-section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="section-header">
          <h2>Top News</h2>
          <button className="view-all-btn">View All <ArrowRight size={16} /></button>
        </div>
        <div className="news-grid">
          <div className="featured-news">
            <NewsCard news={featuredNews} large={true} />
          </div>
          <div className="side-news">
            {regularNews.map(news => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </div>
      </section>

      {/* Market Data Chart Section */}
      <section className="market-data-section container" data-scroll-section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <MarketDataChart />
      </section>

      {/* Latest Tenders Section */}
      <section className="tenders-section container" data-scroll-section style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="section-header">
          <h2>Latest Tenders</h2>
          <button className="view-all-btn">View All Tenders <ArrowRight size={16} /></button>
        </div>
        <div className="tenders-list glass-panel">
          <div className="tender-header">
            <span>Tender ID</span>
            <span>Title</span>
            <span>Client</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {tenders.map(tender => (
            <div className="tender-row" key={tender.id}>
              <span className="tender-id">{tender.id}</span>
              <span className="tender-title">{tender.title}</span>
              <span className="tender-client">{tender.client}</span>
              <span className="tender-value">{tender.value}</span>
              <span className={`tender-status status-${tender.status.toLowerCase().replace(' ', '-')}`}>
                {tender.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Company Marquee Strip */}
      <section className="companies-section" data-scroll-section>
        <div className="companies-header container">
          <p className="companies-eyebrow">Trusted Intelligence Source</p>
          <h2 className="companies-title">Read by the world's leading energy companies</h2>
        </div>
        <div className="marquee-outer">
          {/* Two identical tracks for seamless infinite loop */}
          {[0, 1].map(trackIdx => (
            <div className="marquee-track" key={trackIdx} aria-hidden={trackIdx === 1}>
              {[
                { name: 'Saudi Aramco',   icon: '◎' },
                { name: 'ADNOC',          icon: '◉' },
                { name: 'SABIC',          icon: '⊙' },
                { name: 'QatarEnergy',    icon: '◈' },
                { name: 'Bechtel',        icon: '◇' },
                { name: 'Petrofac',       icon: '◆' },
                { name: 'Wood Group',     icon: '◎' },
                { name: 'Saipem',         icon: '◉' },
                { name: 'Kuwait Oil Co.', icon: '⊛' },
                { name: 'Oman Oil',       icon: '◈' },
                { name: 'TechnipFMC',     icon: '◇' },
                { name: 'McDermott',      icon: '◆' },
                { name: 'KNPC',           icon: '◎' },
                { name: 'Fluor Corp.',    icon: '⊙' },
              ].map((co, i) => (
                <div className="marquee-item" key={i}>
                  <span className="marquee-icon">{co.icon}</span>
                  <span className="marquee-name">{co.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Section */}
      <section className="features-section" data-scroll-section style={{ paddingBottom: '2rem' }}>
        <SubscriptionSection />
      </section>

      <div data-scroll-section>
        <Footer />
      </div>
    </div>
  );
};

export default Home;

