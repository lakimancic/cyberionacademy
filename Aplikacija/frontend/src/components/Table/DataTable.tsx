import './DataTable.css';

type Pagination = {
    page: number;
    setPage: (prev: React.SetStateAction<number>) => void;
    totalPages: number;
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
    pagination?: Pagination;
};

type ValidRow = {
    [key: string]: React.ReactNode;
};

function DataTable<T extends ValidRow>({ data, columns, className, onRowClick, pagination } : Props<T>) {
    return (
        <div className={`data-table-con ${className ? className + '-con' : ''}`}>
            <table className={`data-table ${className ?? ''}`}>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th
                                key={String(col.key)}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, ind) => (
                        <tr
                            key={ind}
                            onClick={() => onRowClick?.(row, ind)}
                        >
                            {columns.map(col => (
                                <td key={String(col.key)}>
                                    {row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {pagination && <div className="data-pagination">
                <button
                    disabled={pagination.page === 1}
                    onClick={() => pagination.setPage(prev => Math.max(prev - 1, 1))}>
                    Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => pagination.setPage(prev => Math.min(prev + 1, pagination.totalPages))}>
                    Next
                </button>
            </div>}
        </div>
    )
}

export default DataTable;