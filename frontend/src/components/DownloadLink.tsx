interface DownloadLinkProps {
  searchWord: string;
}

export const DownloadLink: React.FC<DownloadLinkProps> = ({ searchWord }) => {
  const categories = [
    { name: 'Fragment', suffix: 'Fragment' },
    { name: 'All', suffix: 'All' },
    { name: 'World', suffix: 'World' },
    { name: 'Business', suffix: 'Business' },
    { name: 'Technology', suffix: 'Technology' },
    { name: 'Entertainment', suffix: 'Entertainment' },
    { name: 'Sports', suffix: 'Sports' },
    { name: 'Science', suffix: 'Science' },
    { name: 'Health', suffix: 'Health' },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {categories.map((category) => (
        <a
          key={category.suffix}
          href={`http://localhost:5000/api/download/${encodeURIComponent(searchWord)}?category=${category.suffix}`}
          className="btn btn-soft btn-primary"
          download
        >
          {category.name}
        </a>
      ))}
    </div>
  );
}; 