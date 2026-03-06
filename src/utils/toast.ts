import { toast as sonnerToast, ExternalToast } from 'sonner';
import { playToastSound } from './sounds';

type ToastFunction = (message: string | React.ReactNode, data?: ExternalToast) => string | number;

const withSound = (toastFn: ToastFunction) => {
  return (message: string | React.ReactNode, data?: ExternalToast) => {
    playToastSound('enter');

    return toastFn(message, {
      ...data,
      onDismiss: (t) => {
        playToastSound('exit');
        if (data?.onDismiss) data.onDismiss(t);
      },
      onAutoClose: (t) => {
        playToastSound('exit');
        if (data?.onAutoClose) data.onAutoClose(t);
      }
    });
  };
};

export const toast = {
  ...sonnerToast,
  success: withSound(sonnerToast.success),
  error: withSound(sonnerToast.error),
  info: withSound(sonnerToast.info),
  warning: withSound(sonnerToast.warning),
  message: withSound(sonnerToast),
};
