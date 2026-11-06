export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;

  return (
    <div className="pagination">
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Trước
      </button>
      <span>
        Trang {page}/{totalPages} · {total} mục
      </span>
      <button className="btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau →
      </button>
    </div>
  );
}
