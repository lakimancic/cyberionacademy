import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import './Notification.css';
import { FaCheckCircle } from 'react-icons/fa';
import { FaCircleExclamation, FaCircleXmark } from 'react-icons/fa6';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface NotificationContextType {
    showNotification: (msg: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context)
        throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider : React.FC<NotificationProviderProps> = ({ children }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<NotificationType | null>(null);
    const [visible, setVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const fadeOutTimeoutRef = useRef<number | null>(null);

    const clearTimeouts = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (fadeOutTimeoutRef.current) {
            clearTimeout(fadeOutTimeoutRef.current);
            fadeOutTimeoutRef.current = null;
        }
    };

    const startFadeOut = () => {
        setIsFadingOut(true);
        fadeOutTimeoutRef.current = window.setTimeout(() => {
            setVisible(false);
            setIsFadingOut(false);
            setMessage(null);
            setType(null);
        }, 300);
    };

    const showNotification = useCallback((msg: string, type: NotificationType) => {
        clearTimeouts();

        if (visible) {
            setIsFadingOut(true);
            fadeOutTimeoutRef.current = window.setTimeout(() => {
                setMessage(msg);
                setType(type);
                setIsFadingOut(false);
                setVisible(true);

                timeoutRef.current = window.setTimeout(() => {
                    startFadeOut();
                }, 3000);
            }, 300);
        } else {
            setMessage(msg);
            setType(type);
            setVisible(true);

            timeoutRef.current = window.setTimeout(() => {
                startFadeOut();
            }, 3000);
        }
    }, [visible]);

    useEffect(() => {
        return () => clearTimeouts();
    }, [])

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {message && type && (
                <div className={`notification ${isFadingOut ? 'fade-out' : ''} notf-${type}`}>
                    {type === 'success' && <FaCheckCircle />}
                    {type === 'error' && <FaCircleXmark />}
                    {type === 'warning' && <FaCircleExclamation />}
                    {message}
                </div>
            )}
        </NotificationContext.Provider>
    )
}