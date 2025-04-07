import React, { useState } from 'react';
import { OpenRouterModel } from '../../shared/types';
import { FALLBACK_MODEL } from '../../shared/constants';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isLoading: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // If no models are available, use the fallback model
  const allModels = models.length > 0 ? models : [FALLBACK_MODEL];
  
  // Find the currently selected model
  const currentModel = allModels.find(model => model.id === selectedModel) || allModels[0];
  
  // Filter models based on search query
  const filteredModels = allModels.filter(model => 
    model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.provider.name;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, OpenRouterModel[]>);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="flex items-center">
          {isLoading ? (
            <div className="flex items-center">
              <span className="spinner mr-2"></span>
              <span>Loading models...</span>
            </div>
          ) : (
            <>
              <span className="font-medium">{currentModel.name}</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({currentModel.provider.label})
              </span>
            </>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider} className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                  {provider.toUpperCase()}
                </div>
                <ul>
                  {providerModels.map((model) => (
                    <li key={model.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          model.id === selectedModel ? 'bg-blue-100 dark:bg-blue-900' : ''
                        }`}
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                          <span>Context: {model.context_length} tokens</span>
                          <span>
                            ${model.pricing.prompt.toFixed(4)} / ${model.pricing.completion.toFixed(4)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No models found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
