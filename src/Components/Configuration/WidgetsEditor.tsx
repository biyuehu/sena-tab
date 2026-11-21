import { useState } from 'react'
import { ENGINES, QUOTES } from '@/constants/mapping'
import { f, t } from '@/i18n'
import type { Settings } from '@/store/schema'
import { BooleanField, SelectField, TextField } from './shared'

type Widget = Settings['widgets'][number]

interface WidgetsEditorProps {
  value: Settings['widgets']
  onChange: (value: Settings['widgets']) => void
}

const DEFAULTS_BY_TYPE: Record<Widget['type'], Widget> = {
  time: { type: 'time', format: '24h', showDate: false, showMinutes: true, showSeconds: false },
  greeting: { type: 'greeting', name: '' },
  search: { type: 'search', engine: 'google' },
  quote: { type: 'quote', quote: 'ce' },
  links: { type: 'links', showIcon: true, links: [] },
  location: { type: 'location', mode: 'auto', city: '' },
  weather: { type: 'weather', unit: 'celsius', mode: 'auto', city: '', showDetails: false }
}

const SEARCH_ENGINE_OPTIONS = ENGINES.map(({ key, name }) => ({ value: key, label: name }))

const WidgetFields: React.FC<{
  widget: Widget
  onChange: (widget: Widget) => void
  hasLocationWidget: boolean
}> = ({ widget, onChange, hasLocationWidget }) => {
  const timeFormatOptions = [
    { value: 'clock' as const, label: t`config.widget.time.format.clock` },
    { value: '12h' as const, label: t`config.widget.time.format.12h` },
    { value: '24h' as const, label: t`config.widget.time.format.24h` }
  ]

  const quoteOptions = [
    { value: 'hitokoto' as const, label: t`config.widget.quote.hitokoto` },
    ...(Object.keys(QUOTES) as (keyof typeof QUOTES)[]).map((key) => ({
      value: key,
      label: f(`config.widget.quote.${key}`)
    })),
    { value: 'custom' as const, label: t`config.widget.quote.custom` }
  ]
  switch (widget.type) {
    case 'time': {
      return (
        <>
          <SelectField
            label={t`config.widget.time.format`}
            value={widget.format}
            options={timeFormatOptions}
            onChange={(format) => onChange({ ...widget, format })}
          />
          <BooleanField
            label={t`config.widget.time.showDate`}
            value={widget.showDate}
            onChange={(showDate) => onChange({ ...widget, showDate })}
          />
          <BooleanField
            label={t`config.widget.time.showMinutes`}
            value={widget.showMinutes}
            onChange={(showMinutes) => onChange({ ...widget, showMinutes })}
          />
          <BooleanField
            label={t`config.widget.time.showSeconds`}
            value={widget.showSeconds}
            onChange={(showSeconds) => onChange({ ...widget, showSeconds })}
          />
        </>
      )
    }
    case 'greeting': {
      return (
        <TextField
          label={t`config.widget.greeting.name`}
          value={widget.name}
          onChange={(name) => onChange({ ...widget, name })}
        />
      )
    }
    case 'search': {
      return (
        <SelectField
          label={t`config.widget.search.engine`}
          value={widget.engine}
          options={SEARCH_ENGINE_OPTIONS}
          onChange={(engine) => onChange({ ...widget, engine })}
        />
      )
    }
    case 'quote': {
      return (
        <>
          <SelectField
            label={t`config.widget.quote.source`}
            value={widget.quote}
            options={quoteOptions}
            onChange={(quote) =>
              onChange(quote === 'custom' ? { type: 'quote', quote: 'custom', code: '' } : { type: 'quote', quote })
            }
          />
          {widget.quote === 'custom' && (
            <TextField
              label={t`config.widget.quote.code`}
              value={widget.code}
              onChange={(code) => onChange({ ...widget, code })}
            />
          )}
        </>
      )
    }
    case 'links': {
      return (
        <>
          <BooleanField
            label={t`config.widget.links.showIcon`}
            value={widget.showIcon}
            onChange={(showIcon) => onChange({ ...widget, showIcon })}
          />
          <div className="config-links">
            {widget.links.map((link, index) => (
              <div className="config-links-row" key={link.url || link.name || index.toFixed()}>
                <input
                  type="text"
                  placeholder={t`config.widget.links.name`}
                  value={link.name}
                  onChange={(e) =>
                    onChange({
                      ...widget,
                      links: widget.links.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                    })
                  }
                />
                <input
                  type="text"
                  placeholder={t`config.widget.links.url`}
                  value={link.url}
                  onChange={(e) =>
                    onChange({
                      ...widget,
                      links: widget.links.map((item, i) => (i === index ? { ...item, url: e.target.value } : item))
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...widget, links: widget.links.filter((_, i) => i !== index) })}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="config-add-btn"
              onClick={() => onChange({ ...widget, links: [...widget.links, { name: '', url: '' }] })}
            >
              {t`config.widget.links.add`}
            </button>
          </div>
        </>
      )
    }
    case 'location': {
      return (
        <>
          <SelectField
            label={t`config.widget.location.mode`}
            value={widget.mode}
            options={[
              { value: 'auto' as const, label: t`config.widget.location.mode.auto` },
              { value: 'manual' as const, label: t`config.widget.location.mode.manual` }
            ]}
            onChange={(mode) => onChange({ ...widget, mode })}
          />
          {widget.mode === 'manual' && (
            <TextField
              label={t`config.widget.location.city`}
              value={widget.city}
              onChange={(city) => onChange({ ...widget, city })}
            />
          )}
        </>
      )
    }
    case 'weather': {
      return (
        <>
          <SelectField
            label={t`config.widget.weather.unit`}
            value={widget.unit}
            options={[
              { value: 'celsius' as const, label: t`config.widget.weather.unit.celsius` },
              { value: 'fahrenheit' as const, label: t`config.widget.weather.unit.fahrenheit` }
            ]}
            onChange={(unit) => onChange({ ...widget, unit })}
          />
          {!hasLocationWidget && (
            <>
              <SelectField
                label={t`config.widget.location.mode`}
                value={widget.mode}
                options={[
                  { value: 'auto' as const, label: t`config.widget.location.mode.auto` },
                  { value: 'manual' as const, label: t`config.widget.location.mode.manual` }
                ]}
                onChange={(mode) => onChange({ ...widget, mode })}
              />
              {widget.mode === 'manual' && (
                <TextField
                  label={t`config.widget.location.city`}
                  value={widget.city}
                  onChange={(city) => onChange({ ...widget, city })}
                />
              )}
            </>
          )}
          <BooleanField
            label={t`config.widget.weather.showDetails`}
            value={widget.showDetails}
            onChange={(showDetails) => onChange({ ...widget, showDetails })}
          />
        </>
      )
    }
    default: {
      return null
    }
  }
}

const WidgetsEditor: React.FC<WidgetsEditorProps> = ({ value, onChange }) => {
  const [pendingType, setPendingType] = useState<Widget['type']>('time')

  const updateAt = (index: number, widget: Widget): void =>
    onChange(value.map((item, i) => (i === index ? widget : item)))

  const removeAt = (index: number): void => onChange(value.filter((_, i) => i !== index))

  const moveAt = (index: number, offset: number): void => {
    const target = index + offset
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const hasLocationWidget = value.some((item) => item.type === 'location')

  return (
    <div className="config-section">
      {value.map((widget, index) => (
        <div className="config-widget-card" key={`${widget.type}-${index.toFixed()}`}>
          <div className="config-widget-header">
            <strong>{f(`config.widget.type.${widget.type}`)}</strong>
            <div className="config-widget-actions">
              <button type="button" disabled={index === 0} onClick={() => moveAt(index, -1)}>
                ↑
              </button>
              <button type="button" disabled={index === value.length - 1} onClick={() => moveAt(index, 1)}>
                ↓
              </button>
              <button type="button" onClick={() => removeAt(index)}>
                ✕
              </button>
            </div>
          </div>
          <WidgetFields
            widget={widget}
            onChange={(next) => updateAt(index, next)}
            hasLocationWidget={hasLocationWidget}
          />
        </div>
      ))}
      <div className="config-add-row">
        <select value={pendingType} onChange={(e) => setPendingType(e.target.value as Widget['type'])}>
          {[
            { value: 'time' as const, label: t`config.widget.type.time` },
            { value: 'greeting' as const, label: t`config.widget.type.greeting` },
            { value: 'search' as const, label: t`config.widget.type.search` },
            { value: 'quote' as const, label: t`config.widget.type.quote` },
            { value: 'links' as const, label: t`config.widget.type.links` },
            { value: 'weather' as const, label: t`config.widget.type.weather` },
            { value: 'location' as const, label: t`config.widget.type.location` }
          ].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="config-add-btn"
          onClick={() => onChange([...value, DEFAULTS_BY_TYPE[pendingType]])}
        >
          {t`config.widget.add`}
        </button>
      </div>
    </div>
  )
}

export default WidgetsEditor
