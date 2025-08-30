import { FaArrowUp } from "react-icons/fa";
import "./DataTable.css";

type Pagination = {
  page: number;
  setPage: (prev: React.SetStateAction<number>) => void;
  totalPages: number;
};

type Sort<T> = {
  key: keyof T;
  dir: "asc" | "desc";
  onSetSortKey: (prev: React.SetStateAction<keyof T>) => void;
  onSetSortDir: (prev: React.SetStateAction<"asc" | "desc">) => void;
};

type Column<T> = {
  key: keyof T;
  header: string;
  sortable?: boolean;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (row: T, ind: number) => void;
  rowClass?: (row: T) => string;
  pagination?: Pagination;
  sort?: Sort<T>;
};

type ValidRow = {
  [key: string]: React.ReactNode;
};

function DataTable<T extends ValidRow>({
  data,
  columns,
  className,
  onRowClick,
  rowClass,
  pagination,
  sort,
}: Props<T>) {
  return (
    <div className={`data-table-con ${className ? className + "-con" : ""}`}>
      <table className={`data-table ${className ?? ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={col.sortable ? "data-sortable" : ""}
                onClick={() => {
                  if (!col.sortable || !sort) return;

                  if (col.key === sort.key)
                    sort.onSetSortDir(sort.dir === "asc" ? "desc" : "asc");
                  else {
                    sort.onSetSortDir("asc");
                    sort.onSetSortKey(col.key);
                  }
                }}
              >
                {col.header}{" "}
                {col.sortable && sort ? (
                  sort.key === col.key ? (
                    <FaArrowUp className={`data-sort-${sort.dir}`} />
                  ) : (
                    <FaArrowUp />
                  )
                ) : (
                  ""
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ind) => (
            <tr
              key={ind}
              onClick={() => onRowClick?.(row, ind)}
              className={rowClass?.(row)}
            >
              {columns.map((col) => (
                <td key={String(col.key)}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div className="data-pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => pagination.setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              pagination.setPage((prev) =>
                Math.min(prev + 1, pagination.totalPages)
              )
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
