import type { LatLng } from '@/types/geo';
import type { Hospital } from '@/types/domain';
import { haversineKm } from '@/lib/geo';

export const HOSPITAL_SEARCH_RADIUS_KM = 350;

export type HospitalWithDistance = Hospital & {
  distanceKm: number | null;
};

export type NearbyHospital = HospitalWithDistance;


export type HospitalExtended = Hospital & {
  phone?: string;
  website?: string;
  address?: string;
  state?: string;
  zip?: string;
  county?: string;
  owner?: string;
  beds?: number;
  status?: string;
};

const hospitals: Hospital[] = [
  {
    id: 'alaska-native-medical-center',
    name: 'Alaska Native Medical Center',
    city: 'Anchorage',
    location: { lat: 61.182008372, lng: -149.800204779 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 148
  },
  {
    id: 'providence-alaska-medical-center',
    name: 'Providence Alaska Medical Center',
    city: 'Anchorage',
    location: { lat: 61.1883573710001, lng: -149.818746555 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 371
  },
  {
    id: 'mat-su-regional-medical-center',
    name: 'Mat-Su Regional Medical Center',
    city: 'Palmer',
    location: { lat: 61.562790019, lng: -149.258438036 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 74
  },
  {
    id: 'samuel-simmonds-memorial-hospital',
    name: 'Samuel Simmonds Memorial Hospital',
    city: 'Utqiagvik',
    location: { lat: 71.297309274, lng: -156.728960777 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 10
  },
  {
    id: 'fairbanks-memorial-hospital',
    name: 'Fairbanks Memorial Hospital',
    city: 'Fairbanks',
    location: { lat: 64.8318561620001, lng: -147.739146369 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 217
  },
  {
    id: 'south-peninsula-hospital',
    name: 'South Peninsula Hospital',
    city: 'Homer',
    location: { lat: 59.6525660200001, lng: -151.550204005 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 50
  },
  {
    id: 'bartlett-regional-hospital',
    name: 'Bartlett Regional Hospital',
    city: 'Juneau',
    location: { lat: 58.328975615, lng: -134.465208995 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 73
  },
  {
    id: 'providence-seward-medical-center',
    name: 'Providence Seward Medical Center',
    city: 'Seward',
    location: { lat: 60.1053190050001, lng: -149.446269027 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 46
  },
  {
    id: 'searhc-mt-edgecumbe',
    name: 'SEARHC Mt. Edgecumbe',
    city: 'Sitka',
    location: { lat: 57.0518299830001, lng: -135.354972992 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 27
  },
  {
    id: 'providence-valdez-medical-center',
    name: 'Providence Valdez Medical Center',
    city: 'Valdez',
    location: { lat: 61.13023788, lng: -146.35508078 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 21
  },
  {
    id: 'central-peninsula-hospital',
    name: 'Central Peninsula Hospital',
    city: 'Soldotna',
    location: { lat: 60.4933289950001, lng: -151.076581968 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 50
  },
  {
    id: 'peace-health-ketchikan-medical-center',
    name: 'Peace Health Ketchikan Medical Center',
    city: 'Ketchikan',
    location: { lat: 55.3537680050001, lng: -131.686160998 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 54
  },
  {
    id: 'yukon-kuskokwim-delta-regional-hospital',
    name: 'Yukon-Kuskokwim Delta Regional Hospital',
    city: 'Bethel',
    location: { lat: 60.788075093, lng: -161.785488231 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 37
  },
  {
    id: 'searhc-wrangell-medical-center',
    name: 'SEARHC Wrangell Medical Center',
    city: 'Wrangell',
    location: { lat: 56.470404, lng: -132.3836088 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 22
  }
];

/**
 * Extended hospital data with additional metadata
 * Source: ak_supp.csv
 */
export const hospitalExtendedData: HospitalExtended[] = [
  {
    id: 'central-peninsula-hospital',
    name: 'Central Peninsula General Hospital',
    city: 'Soldotna',
    location: { lat: 60.493169052, lng: -151.077826958 },
    airborneCapable: true,
    traumaLevel: 2,
    capacity: 108,
    phone: '(907) 796-8900',
    address: '250 Hospital Place',
    state: 'AK',
    zip: '99669',
    county: 'Kenai Peninsula',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'fairbanks-memorial-hospital',
    name: 'Fairbanks Memorial Hospital',
    city: 'Fairbanks',
    location: { lat: 64.831744708, lng: -147.739392817 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 217,
    phone: '(907) 452-8181',
    address: '1650 Cowles Street',
    state: 'AK',
    zip: '99701',
    county: 'Fairbanks North Star',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'mat-su-regional-medical-center',
    name: 'Mat-Su Regional Medical Center',
    city: 'Palmer',
    location: { lat: 61.5628935770001, lng: -149.258311157 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 74,
    phone: '(907) 861-6000',
    address: '2500 S. Woodworth Loop',
    state: 'AK',
    zip: '99645',
    county: 'Matanuska-Susitna',
    owner: 'PROPRIETARY',
    status: 'OPEN'
  },
  {
    id: 'providence-valdez-medical-center',
    name: 'Providence Valdez Medical Center',
    city: 'Valdez',
    location: { lat: 61.1365337820001, lng: -146.346551668 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 21,
    phone: '(907) 835-2249',
    address: '911 Meals Avenue',
    state: 'AK',
    zip: '99686',
    county: 'Valdez-Cordova',
    owner: 'GOVERNMENT - LOCAL',
    status: 'OPEN'
  },
  {
    id: 'maniilaq-medical-center',
    name: 'Maniilaq Medical Center',
    city: 'Kotzebue',
    location: { lat: 66.8960016240001, lng: -162.586826252 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 17,
    phone: '(907) 442-3321',
    address: '436 5th Ave.',
    state: 'AK',
    zip: '99752',
    county: 'Northwest Arctic',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'searhc-mt-edgecumbe',
    name: 'Mt Edgecumbe Hospital - Searhc',
    city: 'Sitka',
    location: { lat: 57.051565564, lng: -135.354876741 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 27,
    phone: '(907) 966-2411',
    address: '222 Tongass Drive',
    state: 'AK',
    zip: '99835',
    county: 'Sitka',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'norton-sound-regional-hospital',
    name: 'Norton Sound Regional Hospital',
    city: 'Nome',
    location: { lat: 64.4991221940001, lng: -165.378188783 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 36,
    phone: '(907) 443-3311',
    address: '1000 Greg Kruschek Ave',
    state: 'AK',
    zip: '99762',
    county: 'Nome',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'elmendorf-afb-hospital',
    name: 'Elmendorf AFB Hospital',
    city: 'Anchorage',
    location: { lat: 61.2353454350001, lng: -149.744885008 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 57,
    phone: '(907) 755-2274',
    address: '5955 Zeamer Ave.',
    state: 'AK',
    zip: '99506',
    county: 'Anchorage',
    owner: 'GOVERNMENT - FEDERAL',
    status: 'OPEN'
  },
  {
    id: 'yukon-kuskokwim-delta-regional-hospital',
    name: 'Yukon - Kuskokwim Delta Regional Hospital',
    city: 'Bethel',
    location: { lat: 60.7883423500001, lng: -161.784612775 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 37,
    phone: '(907) 543-6300',
    address: '700 Chief Eddie Hoffman Highway',
    state: 'AK',
    zip: '99559',
    county: 'Bethel',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'providence-seward-medical-center',
    name: 'Providence Seward Medical Center',
    city: 'Seward',
    location: { lat: 60.1050581820001, lng: -149.445835369 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 46,
    phone: '(907) 224-5205',
    address: '417 1st Avenue',
    state: 'AK',
    zip: '99664',
    county: 'Kenai Peninsula',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'searhc-wrangell-medical-center',
    name: 'Wrangell Medical Center',
    city: 'Wrangell',
    location: { lat: 56.4717823870001, lng: -132.375803899 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 22,
    phone: '(907) 874-7000',
    address: '310 Bennet Street',
    state: 'AK',
    zip: '99929',
    county: 'Wrangell-Petersburg',
    owner: 'GOVERNMENT - LOCAL',
    status: 'OPEN'
  },
  {
    id: 'providence-alaska-medical-center',
    name: 'Providence Alaska Medical Center',
    city: 'Anchorage',
    location: { lat: 61.1887628800001, lng: -149.819958703 },
    airborneCapable: true,
    traumaLevel: 2,
    capacity: 371,
    phone: '(907) 562-2211',
    address: '3200 Providence Drive',
    state: 'AK',
    zip: '99508',
    county: 'Anchorage',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'south-peninsula-hospital',
    name: 'South Peninsula Hospital',
    city: 'Homer',
    location: { lat: 59.6524701160001, lng: -151.550129834 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 50,
    phone: '(907) 235-8101',
    address: '4300 Bartlett Street',
    state: 'AK',
    zip: '99603',
    county: 'Kenai Peninsula',
    owner: 'GOVERNMENT - DISTRICT/AUTHORITY',
    status: 'OPEN'
  },
  {
    id: 'sitka-community-hospital',
    name: 'Sitka Community Hospital',
    city: 'Sitka',
    location: { lat: 57.0597613310001, lng: -135.346935033 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 27,
    phone: '(907) 747-3241',
    address: '209 Moller Avenue',
    state: 'AK',
    zip: '99835',
    county: 'Sitka',
    owner: 'GOVERNMENT - LOCAL',
    status: 'OPEN'
  },
  {
    id: 'petersburg-medical-center',
    name: 'Petersburg Medical Center',
    city: 'Petersburg',
    location: { lat: 56.8128840750001, lng: -132.955205062 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 27,
    phone: '(907) 772-4291',
    address: '103 Fram St.',
    state: 'AK',
    zip: '99833',
    county: 'Wrangell-Petersburg',
    owner: 'GOVERNMENT - LOCAL',
    status: 'OPEN'
  },
  {
    id: 'peace-health-ketchikan-medical-center',
    name: 'PeaceHealth Ketchikan Medical Center',
    city: 'Ketchikan',
    location: { lat: 55.3537186890001, lng: -131.685788419 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 54,
    phone: '(907) 225-5171',
    address: '3100 Tongass Avenue',
    state: 'AK',
    zip: '99901',
    county: 'Ketchikan Gateway',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'kanakanak-hospital',
    name: 'Kanakanak Hospital',
    city: 'Dillingham',
    location: { lat: 59.0004747610001, lng: -158.536312298 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 14,
    phone: '(907) 842-5201',
    address: '6000 Kanakanak Road',
    state: 'AK',
    zip: '99576',
    county: 'Dillingham',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'providence-kodiak-island-medical-center',
    name: 'Providence Kodiak Island Medical Center',
    city: 'Kodiak',
    location: { lat: 57.8008999830001, lng: -152.375607731 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 25,
    phone: '(907) 486-3281',
    address: '1915 Rezanof Drive',
    state: 'AK',
    zip: '99615',
    county: 'Kodiak Island',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'alaska-native-medical-center',
    name: 'Alaska Native Medical Center - ANMC',
    city: 'Anchorage',
    location: { lat: 61.182950347, lng: -149.800292629 },
    airborneCapable: false,
    traumaLevel: 2,
    capacity: 148,
    phone: '(907) 729-3971',
    address: '4315 Diplomacy Drive',
    state: 'AK',
    zip: '99508',
    county: 'Anchorage',
    owner: 'NON-PROFIT',
    status: 'OPEN'
  },
  {
    id: 'samuel-simmonds-memorial-hospital',
    name: 'Samuel Simmonds Memorial Hospital',
    city: 'Barrow',
    location: { lat: 71.297725035, lng: -156.72903697 },
    airborneCapable: false,
    traumaLevel: 4,
    capacity: 10,
    phone: '(907) 852-9248',
    address: '7000 Uula St',
    state: 'AK',
    zip: '99723',
    county: 'North Slope',
    owner: 'NOT AVAILABLE',
    status: 'OPEN'
  },
  {
    id: 'bartlett-regional-hospital',
    name: 'Bartlett Regional Hospital',
    city: 'Juneau',
    location: { lat: 58.329079511, lng: -134.465152632 },
    airborneCapable: true,
    traumaLevel: 4,
    capacity: 73,
    phone: '(907) 796-8900',
    address: '3260 Hospital Drive',
    state: 'AK',
    zip: '99801',
    county: 'Juneau',
    owner: 'GOVERNMENT - FEDERAL',
    status: 'OPEN'
  }
];

export const getHospitals = () => hospitals;

export const getHospitalsInScope = (origin: LatLng | null): HospitalWithDistance[] => {
  const withDistance = hospitals.map((hospital) => ({
    ...hospital,
    distanceKm: origin ? haversineKm(origin, hospital.location) : null
  }));

  if (!origin) {
    return withDistance.sort((a, b) => b.traumaLevel - a.traumaLevel || a.name.localeCompare(b.name));
  }

  return withDistance.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
};

export const findHospitalsWithinRadius = (
  origin: LatLng | null,
  radiusKm: number = HOSPITAL_SEARCH_RADIUS_KM
): NearbyHospital[] => {
  if (!origin) return [];
  return getHospitalsInScope(origin).filter((hospital) => (hospital.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusKm);
};
