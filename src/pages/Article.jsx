
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { mockNews, mockTenders, mockProjects } from '../data/mockData';
import SubscriptionSection from '../components/SubscriptionSection';
import Footer from '../components/Footer';
import './Article.css';

const Article = () => {
  const { id } = useParams();
  
  // Search across all data sources
  const allData = [...mockNews, ...mockTenders, ...mockProjects];
  const article = allData.find(item => item.id.toString() === id);

  if (!article) {
    return (
      <div className="container" style={{ paddingTop: '4rem', minHeight: '60vh' }}>
        <h2>Article not found</h2>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
      </div>
    );
  }

  // Extract the first paragraph from the HTML body for the free sample
  let sampleText = "";
  if (article.body) {
    const firstParagraphMatch = article.body.match(/<p>(.*?)<\/p>/);
    sampleText = firstParagraphMatch ? firstParagraphMatch[1] : article.excerpt;
  } else {
    sampleText = article.excerpt || article.name || article.title;
  }

  return (
    <div className="article-page">
      <div className="container article-container">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back</Link>
        
        <header className="article-header">
          <span className="article-category">{article.category || article.sector}</span>
          <h1 className="article-title">{article.title || article.name}</h1>
          <div className="article-meta">
            <span className="article-author">{article.author ? `By ${article.author}` : article.client}</span>
            <span className="article-date">{article.date || article.deadline}</span>
          </div>
        </header>

        <div className="article-featured-image">
          <img src={article.image} alt={article.title} />
        </div>

        <div className="article-content">
          <p className="article-lead">{article.excerpt}</p>
          <div className="article-sample">
            <p>{sampleText}</p>
          </div>

          <div className="paywall-overlay">
            <div className="paywall-message">
              <h3>Subscribe to read the full article</h3>
              <p>Get exclusive access to the latest intelligence, tenders, and exact data focused on the Middle East and Saudi Aramco.</p>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionSection />
      <Footer />
    </div>
  );
};

export default Article;

