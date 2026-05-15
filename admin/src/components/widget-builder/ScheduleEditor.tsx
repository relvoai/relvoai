import React from 'react';
import { Button, Input, Switch } from '../UI';
import { Clock } from 'lucide-react';
import { BusinessHours } from '../../types';

interface ScheduleEditorProps {
  value: BusinessHours;
  onChange: (val: BusinessHours) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const handleDayChange = (day: string, field: 'open' | 'close' | 'is_closed', val: any) => {
    const newSchedule = { ...value.schedule };
    if (!newSchedule[day]) {
      newSchedule[day] = { open: '09:00', close: '17:00', is_closed: false };
    }
    
    newSchedule[day] = {
      ...newSchedule[day],
      [field]: val
    };

    onChange({ ...value, schedule: newSchedule });
  };

  const toggleEnabled = (checked: boolean) => {
    onChange({ ...value, enabled: checked });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Enable Business Hours</div>
            <div className="text-xs text-muted-foreground">Widget will go offline outside these hours</div>
          </div>
        </div>
        <Switch checked={value.enabled} onCheckedChange={toggleEnabled} />
      </div>

      {value.enabled && (
        <div className="border border-border rounded-lg bg-card divide-y divide-border">
          {DAYS.map(day => {
            const dayConfig = value.schedule?.[day] || { open: '09:00', close: '17:00', is_closed: false };
            return (
              <div key={day} className="flex items-center justify-between p-3 text-sm">
                <div className="w-28 font-medium">{day}</div>
                
                {dayConfig.is_closed ? (
                   <div className="flex-1 text-center text-muted-foreground text-xs italic">Closed</div>
                ) : (
                   <div className="flex items-center gap-2">
                     <Input 
                        type="time" 
                        value={dayConfig.open} 
                        onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                        className="w-24 h-8 text-xs"
                     />
                     <span className="text-muted-foreground">-</span>
                     <Input 
                        type="time" 
                        value={dayConfig.close} 
                        onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                        className="w-24 h-8 text-xs"
                     />
                   </div>
                )}

                <div className="w-20 flex justify-end">
                   <Button 
                     variant={dayConfig.is_closed ? "outline" : "ghost"} 
                     size="sm" 
                     className="h-7 text-xs"
                     onClick={() => handleDayChange(day, 'is_closed', !dayConfig.is_closed)}
                   >
                     {dayConfig.is_closed ? 'Open' : 'Close'}
                   </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}