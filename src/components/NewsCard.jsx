import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './NewsCard.css';

const NewsCard = ({ news, large = false }) => {
  const navigate = useNavigate();

  return (
    <article className={`news-card ${large ? 'news-card-large' : ''} animate-fade-in`} onClick={() => navigate(`/article/${news.id}`)}>
      <div className="news-image-wrapper">
        <img src={news.image} alt={news.title} className="news-image" />
        <span className="news-category">{news.category}</span>
      </div>
      <div className="news-content">
        <div className="news-meta">
          <span className="news-author">{news.author}</span>
          <span className="news-date">{news.date}</span>
        </div>
        <Link to={`/article/${news.id}`} className="news-title-link">
          <h3 className="news-title">{news.title}</h3>
        </Link>
        {large && <p className="news-excerpt">{news.excerpt}</p>}
        <Link to={`/article/${news.id}`} className="read-more">
          Read more <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
};

export default NewsCard;

