import React from 'react';
import { Radio, CheckSquare } from 'lucide-react';

interface ExtrasGroupMetaProps {
  extrasType: string;
  required: boolean;
  count: number;
}

const ExtrasGroupMeta: React.FC<ExtrasGroupMetaProps> = ({ extrasType, required, count }) => (
  <div className="flex flex-wrap gap-2 mb-3 items-center">
    <span className="flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100 capitalize">
      {extrasType === 'single' ? (
        <>
          <Radio className="w-3.5 h-3.5 mr-1" />
          Single Choice
        </>
      ) : (
        <>
          <CheckSquare className="w-3.5 h-3.5 mr-1" />
          Multiple Choice
        </>
      )}
    </span>
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${required ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {required ? 'Required' : 'Optional'}
    </span>
    <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-medium border border-gray-100">
      {count} item{count !== 1 ? 's' : ''}
    </span>
  </div>
);

export default ExtrasGroupMeta; 