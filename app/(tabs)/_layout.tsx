import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '~/hooks/useUser';
import { useTheme } from '~/context/ThemeContext';

export default function TabsLayout() {
  // ✅ Obtenemos los datos del usuario desde tu propio hook
  const { userData, loading } = useUser();
  const { isDark } = useTheme();

  if (loading) return null; // o muestra un loader si prefieres

  const role = userData?.role;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDark ? '#191919' : '#ffffff',
          borderTopWidth: 0,
          borderTopColor: isDark ? '#2d2d2d' : '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: { 
          backgroundColor: isDark ? '#0C0C0C' : '#ffffff' 
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
        headerShown: false,
        tabBarActiveTintColor: '#925ffa',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="territories"
        options={{
          title: 'Territorios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ Solo visible si es admin o superadmin */}
      {(role === 'admin' || role === 'superadmin') && (
        <Tabs.Screen
          name="admin/users"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      {(role === 'admin' || role === 'superadmin') && (
        <Tabs.Screen
          name="admin/groups"
          options={{
            title: 'Grupos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      {(role === 'admin' || role === 'superadmin') && (
        <Tabs.Screen
          name="admin/report"
          options={{
            title: 'Reporte',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="admin/group/[id]"
        options={{
          href: null, // Esto oculta la pantalla del tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
