import apiClient from "../../api/client";



export const getTransByTransId = async (Trans_id, Login_Date) => {
  return apiClient.get(
    `/api/VoucherTrans?Trans_id=${Trans_id}&Login_Date=${Login_Date}`,
  );
};

export const TransDetailsByTransId = async (Trans_id) => {
  return apiClient.get(`/api/VoucherDetail?Trans_id=${Trans_id}`);
};

export const deleteVoucher = async (voucher) => {
  return apiClient.post(`/api/DelVoucher`, voucher);
};

