import { ITelephonyProvider } from './TelephonyProvider';
import { MockTelephonyProvider } from './MockTelephonyProvider';
import { ExotelProvider } from './ExotelProvider';
import { AirtelIqProvider } from './AirtelIqProvider';
import { config } from '../config';

let activeProvider: ITelephonyProvider | null = null;

export function getTelephonyProvider(): ITelephonyProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const configuredProvider = config.telephony.provider;

  switch (configuredProvider) {
    case 'EXOTEL':
    case 'EXOTEL_INDIA':
      activeProvider = new ExotelProvider();
      break;
    case 'AIRTEL':
    case 'AIRTEL_IQ':
      activeProvider = new AirtelIqProvider();
      break;
    case 'MOCK':
    default:
      activeProvider = new MockTelephonyProvider();
      break;
  }

  console.log(`[TelephonyFactory] Active provider initialized: ${activeProvider.name} (Mock Sandbox: ${activeProvider.getProviderInfo().isMock})`);
  return activeProvider;
}

export { ITelephonyProvider, MockTelephonyProvider, ExotelProvider, AirtelIqProvider };
