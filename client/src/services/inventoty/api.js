// Shim axios instance to the shared api client
import api from '../../api/client';

export const getInventoryOverview = async () => {
  const { data } = await api.get('/api/inventory/dashboard/overview');
  return data;
};

export const getTopUsedParts = async (days = 30) => {
  const { data } = await api.get('/api/inventory/dashboard/top-used', { params: { days } });
  return data.items || [];
};

// Reports API
export const getStockSummaryReport = async (params = {}) => {
  const { data } = await api.get('/api/inventory/reports/stock-summary', { params });
  return data;
};

export const getSupplierSpendReport = async (params = {}) => {
  const { data } = await api.get('/api/inventory/reports/supplier-spend', { params });
  return data;
};

// Downloads
export const downloadStockSummaryCSV = async (params = {}) => {
  const response = await api.get('/api/inventory/reports/stock-summary/download.csv', {
    params,
    responseType: 'blob'
  });
  return response;
};

export const downloadStockSummaryPDF = async (params = {}) => {
  const response = await api.get('/api/inventory/reports/stock-summary/download.pdf', {
    params,
    responseType: 'blob'
  });
  return response;
};

export default api;
 
// Supplier spend downloads
export const downloadSupplierSpendCSV = async (params = {}) => {
  const response = await api.get('/api/inventory/reports/supplier-spend/download.csv', {
    params,
    responseType: 'blob'
  });
  return response;
};

export const downloadSupplierSpendPDF = async (params = {}) => {
  const response = await api.get('/api/inventory/reports/supplier-spend/download.pdf', {
    params,
    responseType: 'blob'
  });
  return response;
};
