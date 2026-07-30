import { mockNews } from '../data/mockData';
import NewsCard from '../components/NewsCard';

const AramcoFocus = () => {
  const aramcoNews = mockNews.filter(n => n.category === 'Aramco Focus');

  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <div className="section-header">
        <h2>Aramco Focus</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {aramcoNews.map(news => (
          <NewsCard key={news.id} news={news} />
        ))}
        {/* Placeholder if few results */}
        {aramcoNews.map(news => (
          <NewsCard key={`dup-${news.id}`} news={{...news, id: `dup-${news.id}`}} />
        ))}
      </div>
    </div>
  );
};

export default AramcoFocus;

