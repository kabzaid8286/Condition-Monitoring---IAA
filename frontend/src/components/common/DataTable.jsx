import React from 'react';
import { Table, Empty } from 'antd';
import './Common.css';

const DataTable = ({ columns, data, loading, pagination, onChange, rowKey = 'id', ...props }) => {
  return (
    <div className="data-table-container">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination ? {
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        } : false}
        onChange={onChange}
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
        }}
        scroll={{ x: 'max-content' }}
        {...props}
      />
    </div>
  );
};

export default DataTable;
