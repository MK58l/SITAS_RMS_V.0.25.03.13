// PrintableQRCodes.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PrintableQRCodes = () => {
  const { supabase } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await supabase.from('tables').select('*');
      setTables(data || []);
    };
    fetchTables();
  }, []);

  return (
    <div className="p-8 grid grid-cols-4 gap-4">
      {tables.map(table => (
        <div key={table.id} className="flex flex-col items-center p-4 border">
          <img 
            src={qrCodes[table.id]} 
            alt={`QR Code for Table ${table.table_number}`}
            className="w-48 h-48 mb-2"
          />
          <h3 className="text-lg font-semibold">Table {table.table_number}</h3>
          <p className="text-sm text-gray-600">Scan to book this table</p>
        </div>
      ))}
    </div>
  );
};

export default PrintableQRCodes;