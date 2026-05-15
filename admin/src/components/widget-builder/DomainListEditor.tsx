
import React, { useState } from 'react';
import { Button, Input, Badge } from '../UI';
import { X, Plus, Globe } from 'lucide-react';

interface DomainListEditorProps {
  domains: string[];
  onChange: (domains: string[]) => void;
}

export function DomainListEditor({ domains, onChange }: DomainListEditorProps) {
  const [input, setInput] = useState('');

  const addDomain = () => {
    if (!input.trim()) return;
    if (domains.includes(input.trim())) {
      setInput('');
      return;
    }
    onChange([...domains, input.trim()]);
    setInput('');
  };

  const removeDomain = (domain: string) => {
    onChange(domains.filter(d => d !== domain));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input 
          placeholder="e.g. mysite.com" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDomain()}
        />
        <Button onClick={addDomain} type="button" variant="secondary">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {domains.map(domain => (
          <Badge key={domain} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            <Globe className="w-3 h-3 text-muted-foreground" />
            {domain}
            <button onClick={() => removeDomain(domain)} className="ml-1 hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {domains.length === 0 && (
          <div className="text-sm text-muted-foreground italic">No domains whitelisted. Widget might not load.</div>
        )}
      </div>
    </div>
  );
}
