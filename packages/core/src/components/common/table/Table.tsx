import React from 'react';

import tableClasses from './Table.classes';
import TableHeaderCell from './TableHeaderCell';

import type { FC, ReactNode } from 'react';

import './Table.css';

export interface TableProps {
  columns: ReactNode[];
  children: ReactNode[];
}

const TableCell: FC<TableProps> = ({ columns, children }) => {
  return (
    <div className={tableClasses.root}>
      <table className={tableClasses.table}>
        <thead className={tableClasses.header}>
          <tr className={tableClasses['header-row']}>
            {columns.map((column, index) => (
              <TableHeaderCell key={index}>{column}</TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody className={tableClasses.body}>{children}</tbody>
      </table>
    </div>
  );
};

export default TableCell;
