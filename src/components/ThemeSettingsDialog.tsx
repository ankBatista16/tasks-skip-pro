import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { THEME_COLORS, ThemeColor } from '@/lib/utils'
import {
  Settings2,
  Moon,
  Sun,
  Monitor,
  LayoutTemplate,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export function ThemeSettingsDialog() {
  const { state, actions } = useStore()
  const { currentUser } = state
  const [open, setOpen] = useState(false)

  if (!currentUser) return null

  const { theme, primaryColor, layoutDensity } = currentUser.preferences

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    actions.updatePreferences({ theme: newTheme })
  }

  const handleColorChange = (newColor: string) => {
    actions.updatePreferences({ primaryColor: newColor })
  }

  const handleDensityChange = (newDensity: 'comfortable' | 'compact') => {
    actions.updatePreferences({ layoutDensity: newDensity })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings2 className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appearance Settings</DialogTitle>
          <DialogDescription>
            Customize how the application looks on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Mode */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Sun className="h-4 w-4" /> Theme Mode
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="justify-start gap-2"
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="h-4 w-4" /> Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="justify-start gap-2"
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="h-4 w-4" /> Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="justify-start gap-2"
                onClick={() => handleThemeChange('system')}
              >
                <Monitor className="h-4 w-4" /> System
              </Button>
            </div>
          </div>

          <Separator />

          {/* Primary Color */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" /> Primary Color
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(THEME_COLORS).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <button
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      primaryColor === key
                        ? 'border-foreground ring-2 ring-offset-2'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: value.color }}
                    onClick={() => handleColorChange(key)}
                    title={value.label}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {value.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Layout Density */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" /> Layout Density
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  layoutDensity === 'comfortable' ? 'default' : 'outline'
                }
                onClick={() => handleDensityChange('comfortable')}
                className="h-20 flex-col gap-2"
              >
                <div className="space-y-1 w-full border rounded p-1 bg-background/50">
                  <div className="h-2 w-3/4 bg-primary/20 rounded"></div>
                  <div className="h-2 w-1/2 bg-primary/20 rounded"></div>
                </div>
                Comfortable
              </Button>
              <Button
                variant={layoutDensity === 'compact' ? 'default' : 'outline'}
                onClick={() => handleDensityChange('compact')}
                className="h-20 flex-col gap-2"
              >
                <div className="space-y-0.5 w-full border rounded p-1 bg-background/50">
                  <div className="h-1.5 w-3/4 bg-primary/20 rounded"></div>
                  <div className="h-1.5 w-1/2 bg-primary/20 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-primary/20 rounded"></div>
                </div>
                Compact
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
