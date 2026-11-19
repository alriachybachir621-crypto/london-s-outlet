import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Lock, X } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  PASSCODE_SUFFIX,
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { StoreInfo } from '../types';
import { DEFAULT_STORE_INFO } from '../data/defaults';

const ATTEMPTS_KEY = 'lo_pin_attempts';
const LOCK_UNTIL_KEY = 'lo_pin_lock_until';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

interface PinGateModalProps {
  open: boolean;
  storeInfo: StoreInfo;
  onClose: () => void;
  onAuthenticated: () => void;
}

export function PinGateModal({
  open,
  storeInfo,
  onClose,
  onAuthenticated,
}: PinGateModalProps) {
  const [setupStep, setSetupStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forceLoginMode, setForceLoginMode] = useState(false);
  const [lockUntil, setLockUntil] = useState<number>(() => {
    const raw = localStorage.getItem(LOCK_UNTIL_KEY);
    return raw ? Number(raw) : 0;
  });
  const [now, setNow] = useState(Date.now());

  const isSetupMode = !storeInfo.codeConfigured && !forceLoginMode;
  const isLocked = lockUntil > now;

  useEffect(() => {
    if (!open) {
      setPin('');
      setFirstPin('');
      setSetupStep('first');
      setErrorMsg('');
      return;
    }
    const storedLock = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
    setLockUntil(storedLock);
    setNow(Date.now());
  }, [open]);

  useEffect(() => {
    if (!open || !isLocked) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockUntil) {
        localStorage.removeItem(LOCK_UNTIL_KEY);
        localStorage.removeItem(ATTEMPTS_KEY);
        setLockUntil(0);
        setErrorMsg('');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [open, isLocked, lockUntil]);

  const recordFailedAttempt = useCallback(() => {
    const prev = Number(localStorage.getItem(ATTEMPTS_KEY) || 0);
    const next = prev + 1;
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCK_DURATION_MS;
      localStorage.setItem(LOCK_UNTIL_KEY, String(until));
      localStorage.setItem(ATTEMPTS_KEY, '0');
      setLockUntil(until);
      setNow(Date.now());
      setErrorMsg('Too many wrong attempts. Locked for 5 minutes.');
    } else {
      localStorage.setItem(ATTEMPTS_KEY, String(next));
      setErrorMsg('Wrong code');
    }
  }, []);

  const submitPin = useCallback(
    async (enteredPin: string) => {
      if (submitting || isLocked) return;

      if (isSetupMode) {
        if (setupStep === 'first') {
          setFirstPin(enteredPin);
          setPin('');
          setSetupStep('confirm');
          setErrorMsg('');
          return;
        }
        if (enteredPin !== firstPin) {
          setPin('');
          setFirstPin('');
          setSetupStep('first');
          setErrorMsg('Codes did not match. Try again.');
          return;
        }
        setSubmitting(true);
        setErrorMsg('');
        try {
          await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            enteredPin + PASSCODE_SUFFIX,
          );
          try {
            await setDoc(
              doc(db, 'store', 'info'),
              {
                ...DEFAULT_STORE_INFO,
                ...storeInfo,
                codeConfigured: true,
                updatedAt: Date.now(),
              },
              { merge: true },
            );
          } catch (fsErr) {
            handleFirestoreError(fsErr, OperationType.WRITE, 'store/info');
          }
          localStorage.removeItem(ATTEMPTS_KEY);
          localStorage.removeItem(LOCK_UNTIL_KEY);
          onAuthenticated();
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code || '';
          if (code === 'auth/email-already-in-use') {
            setForceLoginMode(true);
            setSetupStep('first');
            setFirstPin('');
            setPin('');
            setErrorMsg('Access code already exists. Enter your 4-digit code.');
          } else if (code === 'auth/operation-not-allowed') {
            setErrorMsg(
              'Enable Email/Password sign-in in Firebase Console Authentication > Sign-in method.',
            );
          } else {
            setErrorMsg('Could not save code. Please try again.');
          }
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // Login mode
      setSubmitting(true);
      setErrorMsg('');
      try {
        await signInWithEmailAndPassword(
          auth,
          ADMIN_EMAIL,
          enteredPin + PASSCODE_SUFFIX,
        );
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCK_UNTIL_KEY);
        if (!storeInfo.codeConfigured) {
          try {
            await setDoc(
              doc(db, 'store', 'info'),
              {
                ...DEFAULT_STORE_INFO,
                ...storeInfo,
                codeConfigured: true,
                updatedAt: Date.now(),
              },
              { merge: true },
            );
          } catch (fsErr) {
            handleFirestoreError(fsErr, OperationType.WRITE, 'store/info');
          }
        }
        onAuthenticated();
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        setPin('');
        if (code === 'auth/too-many-requests') {
          const until = Date.now() + LOCK_DURATION_MS;
          localStorage.setItem(LOCK_UNTIL_KEY, String(until));
          setLockUntil(until);
          setNow(Date.now());
          setErrorMsg('Too many attempts. Locked for 5 minutes.');
        } else if (code === 'auth/operation-not-allowed') {
          setErrorMsg(
            'Enable Email/Password sign-in in Firebase Console Authentication > Sign-in method.',
          );
        } else {
          recordFailedAttempt();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
      firstPin,
      isLocked,
      isSetupMode,
      onAuthenticated,
      recordFailedAttempt,
      setupStep,
      storeInfo,
      submitting,
    ],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (submitting || isLocked) return;
      setErrorMsg('');
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + d;
        if (next.length === 4) {
          setTimeout(() => submitPin(next), 80);
        }
        return next;
      });
    },
    [isLocked, submitPin, submitting],
  );

  const handleBackspace = useCallback(() => {
    if (submitting || isLocked) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isLocked, submitting]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBackspace, handleDigit, onClose, open]);

  if (!open) return null;

  const remainingSec = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const secs = String(remainingSec % 60).padStart(2, '0');

  const heading = isSetupMode
    ? setupStep === 'first'
      ? 'Set your 4-digit code'
      : 'Confirm your 4-digit code'
    : 'Enter 4-digit code';

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Passcode Pad"
    >
      <div
        className="bg-[#F5F3EF] border-2 border-[#111111] w-full max-w-xs p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 end-3 w-9 h-9 flex items-center justify-center border border-[#111111]/20 bg-white text-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2 pb-5">
          <div className="w-11 h-11 bg-[#111111] text-white flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[#111111]">
            {heading}
          </h2>
        </div>

        {/* 4-dot indicator */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 border-2 transition-colors ${
                i < pin.length
                  ? 'bg-[#C8312B] border-[#C8312B]'
                  : 'bg-white border-[#111111]/40'
              }`}
            />
          ))}
        </div>

        {/* Status / Error message */}
        <div className="min-h-[40px] flex items-center justify-center text-center mb-4 px-2">
          {isLocked ? (
            <p className="text-xs font-semibold text-[#C8312B] tabular-nums">
              Pad locked. Try again in {mins}:{secs}
            </p>
          ) : errorMsg ? (
            <p className="text-xs font-semibold text-[#C8312B]">{errorMsg}</p>
          ) : (
            <p className="text-xs text-[#2B2B2B]/65">
              {submitting ? 'Verifying...' : 'Use keypad to enter 4 digits'}
            </p>
          )}
        </div>

        {/* Numeric 0-9 Pad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLocked || submitting}
              onClick={() => handleDigit(digit)}
              className="h-13 bg-white border border-[#111111]/20 font-display text-xl font-bold text-[#111111] hover:bg-[#111111] hover:text-white active:scale-95 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            disabled={isLocked || submitting}
            onClick={() => {
              setPin('');
              setErrorMsg('');
            }}
            className="h-13 bg-[#ECE8E1] border border-[#111111]/20 text-xs font-semibold uppercase tracking-wider text-[#2B2B2B] hover:bg-[#111111] hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={isLocked || submitting}
            onClick={() => handleDigit('0')}
            className="h-13 bg-white border border-[#111111]/20 font-display text-xl font-bold text-[#111111] hover:bg-[#111111] hover:text-white active:scale-95 transition-colors disabled:opacity-40 cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            disabled={isLocked || submitting}
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-13 bg-[#ECE8E1] border border-[#111111]/20 flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
