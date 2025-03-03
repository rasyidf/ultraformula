import { useCallback, useState } from "react";

export const useStorage = (key: string, initialValue: any, storageType: 'local' | 'session' = 'local') => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = storageType === 'local' ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: any) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (storageType === 'local') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                } else {
                    window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error(error);
            }
        },
        [key, storedValue, storageType]
    );

    const syncStorage = useCallback(() => {
        try {
            const item = storageType === 'local' ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        }
        catch (error) {
            console.error(error);
        }
    }, [key, storageType]);

    return [storedValue, setValue, syncStorage] as const;
}