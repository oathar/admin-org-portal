import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const DynamicForm = ({ fields, formData, errors, onChange, mode }) => {
  const renderTextField = (field, value, error) => (
    <div key={field.name} className="space-y-1 w-full">
      <Label htmlFor={field.name}>{field.label}</Label>
      <Input
        id={field.name}
        placeholder={field.placeHolder}
        value={value}
        onChange={e => onChange(field.name, e.target.value)}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={field.name === 'code' && mode === 'edit'}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )

  const renderTextareaField = (field, value, error) => (
    <div key={field.name} className="space-y-1 w-full">
      <Label htmlFor={field.name}>{field.label}</Label>
      <textarea
        id={field.name}
        placeholder={field.placeHolder}
        value={value}
        onChange={e => onChange(field.name, e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )

  const renderField = field => {
    const { name, label, type, placeHolder, options = [] } = field
    const value = formData[name] || ''
    const error = errors[name]
    const commonClasses = 'space-y-1 w-full'

    switch (type) {
      case 'text':
        return renderTextField(field, value, error)
      case 'textarea':
        return renderTextareaField(field, value, error)
      case 'color':
        return (
          <div key={name} className={commonClasses}>
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-4">
              <Input
                id={name}
                type="color"
                value={value || '#000000'}
                onChange={e => onChange(name, e.target.value)}
                className="w-16 h-10 p-1 border rounded cursor-pointer"
              />
              <span className="text-sm font-mono text-gray-600">
                {value || '#000000'}
              </span>
            </div>
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        )
      case 'select':
        return (
          <div key={name} className={commonClasses}>
            <Label htmlFor={name}>{label}</Label>
            <Select onValueChange={val => onChange(name, val)} value={value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeHolder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt, i) => (
                  <SelectItem key={i} value={opt.value || opt}>
                    {opt.label || opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        )
      case 'chip':
        return (
          <div key={name} className={`${commonClasses} md:col-span-2`}>
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2">
              {options.map((opt, i) => {
                const selected = Array.isArray(value)
                  ? value.includes(opt.value || opt)
                  : false
                return (
                  <Button
                    key={i}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    onClick={() => {
                      let newValues = Array.isArray(value) ? [...value] : []
                      if (selected) {
                        newValues = newValues.filter(
                          v => v !== (opt.value || opt)
                        )
                      } else {
                        newValues.push(opt.value || opt)
                      }
                      onChange(name, newValues)
                    }}
                  >
                    {opt.label || opt}
                  </Button>
                )
              })}
            </div>
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const primaryColorField = fields.find(f => f.name === 'theme.primaryColor')
  const secondaryColorField = fields.find(f => f.name === 'theme.secondaryColor')
  const otherFields = fields.filter(
    f => f.name !== 'theme.primaryColor' && f.name !== 'theme.secondaryColor'
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {otherFields.map(renderField)}
        {primaryColorField && renderField(primaryColorField)}
      </div>

      {secondaryColorField && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="secondaryColor">
            <AccordionTrigger className="text-base font-medium">
              Add Secondary Color
            </AccordionTrigger>
            <AccordionContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField(secondaryColorField)}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}

export default DynamicForm