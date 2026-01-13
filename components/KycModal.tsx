
import React, { useState } from 'react';
import type { KycData, Region } from '../types';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KycData) => void;
}

const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<KycData, 'idDocument'>>({
    fullName: '',
    dateOfBirth: '',
    nationality: 'Nigerian',
    region: 'Africa',
    idType: 'national-id',
    idNumber: '',
    bankName: '',
    accountNumber: '',
  });
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileObject(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileObject) return;

    setIsLoading(true);
    
    // Convert File to Base64 for storage and admin viewing
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit({ ...formData, idDocument: base64String });
        setIsLoading(false);
    };
    reader.readAsDataURL(fileObject);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Localized account provisioning</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <h3 className="text-md font-semibold text-gray-500 border-b pb-2">Personal Information</h3>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Settlement Region</label>
                <select name="region" id="region" value={formData.region} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-bold">
                    <option value="Africa">Africa (NGN)</option>
                    <option value="Europe">Europe (EUR)</option>
                    <option value="Americas">Americas (USD)</option>
                    <option value="Asia">Asia (SGD/HKD)</option>
                </select>
              </div>
          </div>

          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <input type="text" name="nationality" id="nationality" value={formData.nationality} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>
          
          <h3 className="text-md font-semibold text-gray-500 border-b pb-2 pt-4">Identity Verification</h3>
          <div>
            <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
            <select name="idType" id="idType" value={formData.idType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="national-id">National ID Card (NIN)</option>
                <option value="drivers-license">Driver's License</option>
                <option value="passport">International Passport</option>
            </select>
          </div>
           <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input type="text" name="idNumber" id="idNumber" value={formData.idNumber} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Document</label>
            <label htmlFor="idDocument" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 border border-gray-300 rounded-lg p-2 flex justify-center items-center">
                <span>{fileName ? 'Change file' : 'Upload a file'}</span>
                <input id="idDocument" name="idDocument" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" required />
            </label>
            {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}</p>}
          </div>

          <h3 className="text-md font-semibold text-gray-500 border-b pb-2 pt-4">Local Withdrawal Details</h3>
           <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Local Bank Name</label>
                <input type="text" name="bankName" id="bankName" value={formData.bankName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">Local Account Number</label>
                <input type="text" name="accountNumber" id="accountNumber" value={formData.accountNumber} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

          <div className="pt-2">
             <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2A74B1] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center text-lg uppercase tracking-widest"
            >
              {isLoading ? (
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycModal;
