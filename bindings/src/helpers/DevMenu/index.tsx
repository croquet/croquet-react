import './index.css'
import { useState, useEffect } from 'react'

import { croquet, closeIcon } from '../../img' 
import { updateUrlParams } from '../../utils'

interface DebugOption {
  label: string
  tooltip: string
}

const debugOptions: DebugOption[] = [
  { label: 'session', tooltip: 'Session ID and connections/disconnections' },
  { label: 'messages', tooltip: 'Received from reflector, after decryption (cf. encrypted messages visible in a WebSocket debugger)' },
  { label: 'sends', tooltip: 'Sent to reflector, before encryption (cf. encrypted messages visible in a WebSocket debugger)' },
  { label: 'snapshot', tooltip: 'Snapshot stats' },
  { label: 'hashing', tooltip: 'Code hashing to derive session ID/persistentId' },
  { label: 'subscribe', tooltip: 'Subscription additions/removals' },
  { label: 'classes', tooltip: 'Class registrations' },
  { label: 'ticks', tooltip: 'Each tick received' },
  { label: 'write', tooltip: 'Detect accidental writes from view code to model properties' },
  { label: 'offline', tooltip: 'Disable multiuser' },
]

const buttonSize = '40px'
const buttonMargin = '10px'
const closeBtnSize = '35px'

const menuPosition = {
  'top-left': { top: buttonMargin, left: buttonMargin },
  'top-right': { top: buttonMargin, right: buttonMargin },
  'bottom-left': { bottom: buttonMargin, left: buttonMargin },
  'bottom-right': { bottom: buttonMargin, right: buttonMargin }
}

interface DevMenuProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
export default function DevMenu({ position = 'top-right' }: DevMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const toggleDevMenu = () => setIsOpen(!isOpen)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get('debug')
    if (debugParam) {
      const options = debugParam.split(',')
      const validOptions = options.filter(option => debugOptions.some(debugOption => debugOption.label === option))
      setSelectedOptions(validOptions)
    }
  }, [])

  const handleOptionChange = (option: string, checked: boolean) => {
    const updatedOptions = checked ? [...selectedOptions, option] : selectedOptions.filter((item) => item !== option)
    setSelectedOptions(updatedOptions)
    updateUrlParams(updatedOptions, 'debug')
  }

  return (
    <div className='croquet-dev-menu'>
      <button
        className='toggle-btn'
        onClick={toggleDevMenu}
        style={{ width: buttonSize, height: buttonSize, ...menuPosition[position] }}
      >
        <img src={croquet} alt='Croquet' />
      </button>

      {isOpen && (
        <div className='menu'>
          <span className='header'>Developer Menu</span>
          <hr />
          <div className='title'>Debug Log Options</div>
          <div className='note'>To apply you must refresh the page.</div>
          <ul>
            {debugOptions.map((option, index) => (
              <li key={index}>
                <label title={option.tooltip}>
                  <input
                    type='checkbox'
                    checked={selectedOptions.includes(option.label)}
                    onChange={(e) => handleOptionChange(option.label, e.target.checked)}
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>

          <button className='close-btn' onClick={toggleDevMenu} style={{ width: closeBtnSize, height: closeBtnSize }}>
            <img src={closeIcon} alt='Close' />
          </button>
        </div>
      )}
    </div>
  )
}