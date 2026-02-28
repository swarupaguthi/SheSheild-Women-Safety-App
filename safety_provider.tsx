import createContextHook from "@nkzw/create-context-hook";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

import type { Language, ReportStatus, SafetyReport, SosLog } from "@/types/safety";

interface ReportInput {
  description: string;
  vehicleNumber: string;
  instagramAccount: string;
  phoneNumber: string;
  imageUri: string | null;
  anonymous: boolean;
}

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  label: string;
}

interface PersistedPayload {
  reports: SafetyReport[];
  sosLogs: SosLog[];
  language: Language;
  profileId: string;
}

const REPORTS_KEY = "she_shield_reports";
const SOS_LOGS_KEY = "she_shield_sos_logs";
const LANGUAGE_KEY = "she_shield_language";
const PROFILE_KEY = "she_shield_profile";

const emergencyContacts: string[] = ["+919900112233", "+919900221133"];

const createId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const [SafetyProvider, useSafety] = createContextHook(() => {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [sosLogs, setSosLogs] = useState<SosLog[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [profileId, setProfileId] = useState<string>("");
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<GeoState>({
    latitude: null,
    longitude: null,
    label: "Location unavailable",
  });

  const nativeWatchRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchRef = useRef<number | null>(null);
  const hasHydratedRef = useRef<boolean>(false);

  const bootstrapQuery = useQuery<PersistedPayload>({
    queryKey: ["safety-bootstrap"],
    queryFn: async () => {
      const [storedReports, storedLogs, storedLanguage, storedProfile] = await Promise.all([
        SecureStore.getItemAsync(REPORTS_KEY),
        SecureStore.getItemAsync(SOS_LOGS_KEY),
        SecureStore.getItemAsync(LANGUAGE_KEY),
        SecureStore.getItemAsync(PROFILE_KEY),
      ]);

      return {
        reports: storedReports ? (JSON.parse(storedReports) as SafetyReport[]) : [],
        sosLogs: storedLogs ? (JSON.parse(storedLogs) as SosLog[]) : [],
        language: storedLanguage === "hi" ? "hi" : "en",
        profileId: storedProfile ?? `anon_${createId()}`,
      };
    },
  });

  const persistReportsMutation = useMutation({
    mutationFn: async (items: SafetyReport[]) => {
      await SecureStore.setItemAsync(REPORTS_KEY, JSON.stringify(items));
    },
  });

  const persistSosMutation = useMutation({
    mutationFn: async (items: SosLog[]) => {
      await SecureStore.setItemAsync(SOS_LOGS_KEY, JSON.stringify(items));
    },
  });

  const persistLanguageMutation = useMutation({
    mutationFn: async (lang: Language) => {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    },
  });

  const persistProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      await SecureStore.setItemAsync(PROFILE_KEY, id);
    },
  });

  useEffect(() => {
    if (!bootstrapQuery.data || hasHydratedRef.current) {
      return;
    }

    hasHydratedRef.current = true;
    setReports(bootstrapQuery.data.reports);
    setSosLogs(bootstrapQuery.data.sosLogs);
    setLanguage(bootstrapQuery.data.language);
    setProfileId(bootstrapQuery.data.profileId);
    persistProfileMutation.mutate(bootstrapQuery.data.profileId);
  }, [bootstrapQuery.data]);

  const refreshLocation = useCallback(async (): Promise<GeoState> => {
    try {
      if (Platform.OS === "web") {
        const webLocation = await new Promise<GeoState>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation unavailable"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              });
            },
            () => reject(new Error("Location permission denied")),
            { enableHighAccuracy: true, timeout: 15000 }
          );
        });

        setCurrentLocation(webLocation);
        return webLocation;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const nextLocation: GeoState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
      };
      setCurrentLocation(nextLocation);
      return nextLocation;
    } catch (error) {
      console.log("[SafetyProvider] refreshLocation failed", error);
      Alert.alert("Location Error", "Unable to fetch location. Check permissions and try again.");
      return currentLocation;
    }
  }, [currentLocation]);

  const stopSosTracking = useCallback(() => {
    if (nativeWatchRef.current) {
      nativeWatchRef.current.remove();
      nativeWatchRef.current = null;
    }
    if (webWatchRef.current !== null && Platform.OS === "web" && navigator.geolocation) {
      navigator.geolocation.clearWatch(webWatchRef.current);
      webWatchRef.current = null;
    }
  }, []);

  const startSos = useCallback(async () => {
    const location = await refreshLocation();
    const newLog: SosLog = {
      id: createId(),
      startedAt: new Date().toISOString(),
      stoppedAt: null,
      latitude: location.latitude,
      longitude: location.longitude,
      recipients: emergencyContacts,
    };

    const updatedLogs = [newLog, ...sosLogs];
    setSosLogs(updatedLogs);
    persistSosMutation.mutate(updatedLogs);
    setIsSosActive(true);

    console.log("[SOS] Sending alert", { recipients: emergencyContacts, location });

    if (Platform.OS === "web") {
      if (navigator.geolocation) {
        webWatchRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const liveLocation: GeoState = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
            };
            setCurrentLocation(liveLocation);
          },
          (error) => console.log("[SOS] web tracking error", error.message),
          { enableHighAccuracy: true }
        );
      }
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    nativeWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 4000,
        distanceInterval: 5,
      },
      (position) => {
        const liveLocation: GeoState = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        };
        setCurrentLocation(liveLocation);
      }
    );
  }, [persistSosMutation, refreshLocation, sosLogs]);

  const stopSos = useCallback(() => {
    stopSosTracking();
    setIsSosActive(false);

    const updatedLogs = sosLogs.map((log, index) => {
      if (index === 0 && !log.stoppedAt) {
        return { ...log, stoppedAt: new Date().toISOString() };
      }
      return log;
    });

    setSosLogs(updatedLogs);
    persistSosMutation.mutate(updatedLogs);
    console.log("[SOS] tracking stopped");
  }, [persistSosMutation, sosLogs, stopSosTracking]);

  const submitReport = useCallback(
    (input: ReportInput) => {
      const report: SafetyReport = {
        id: createId(),
        description: input.description.trim(),
        vehicleNumber: input.vehicleNumber.trim() || null,
        instagramAccount: input.instagramAccount.trim() || null,
        phoneNumber: input.phoneNumber.trim() || null,
        locationLabel: currentLocation.label,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        imageUri: input.imageUri,
        anonymous: input.anonymous,
        createdAt: new Date().toISOString(),
        status: "Pending",
      };

      const updatedReports = [report, ...reports];
      setReports(updatedReports);
      persistReportsMutation.mutate(updatedReports);
      console.log("[REPORT] submitted", report.id);
    },
    [currentLocation, persistReportsMutation, reports]
  );

  const updateReportStatus = useCallback(
    (id: string, status: ReportStatus) => {
      const updatedReports = reports.map((report) => (report.id === id ? { ...report, status } : report));
      setReports(updatedReports);
      persistReportsMutation.mutate(updatedReports);
    },
    [persistReportsMutation, reports]
  );

  const toggleLanguage = useCallback(() => {
    const nextLanguage: Language = language === "en" ? "hi" : "en";
    setLanguage(nextLanguage);
    persistLanguageMutation.mutate(nextLanguage);
  }, [language, persistLanguageMutation]);

  const stats = useMemo(() => {
    const pending = reports.filter((report) => report.status === "Pending").length;
    const resolved = reports.filter((report) => report.status === "Resolved").length;
    const activeSos = sosLogs.filter((log) => log.stoppedAt === null).length;

    return {
      totalReports: reports.length,
      pending,
      resolved,
      sosCount: sosLogs.length,
      activeSos,
    };
  }, [reports, sosLogs]);

  return {
    bootstrapLoading: bootstrapQuery.isLoading,
    emergencyContacts,
    profileId,
    reports,
    sosLogs,
    language,
    currentLocation,
    isSosActive,
    stats,
    refreshLocation,
    startSos,
    stopSos,
    submitReport,
    updateReportStatus,
    toggleLanguage,
  };
});
