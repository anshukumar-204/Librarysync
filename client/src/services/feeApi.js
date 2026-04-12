import API from './api';

export const fetchFeeStatus = async () => {
    const response = await API.get('/fees/status');
    return response.data;
};

export const fetchSummaryForAdmin = async (studentId) => {
    const response = await API.get(`/fees/summary/${studentId}`);
    return response.data;
};

export const recordPayment = async (paymentData) => {
    const response = await API.post('/fees/record', paymentData);
    return response.data;
};

export const updateStudentTariff = async (studentId, fee) => {
    const response = await API.patch('/fees/update-tariff', { studentId, fee });
    return response.data;
};

export const fetchFeesRegistry = async () => {
    const response = await API.get('/fees/registry');
    return response.data;
};
