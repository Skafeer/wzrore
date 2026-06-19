import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';

export default function TabsLayout() {
  const { rs } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarActiveBackgroundColor: Colors.primarySoft, // خلفية زرقاء فاتحة للتبويبة النشطة
        tabBarLabelStyle: {
          fontSize: rs(11),
          fontWeight: '700',
          fontFamily: 'Tajawal_700Bold',
          marginTop: rs(2),
        },
        tabBarIconStyle: {
          marginTop: rs(4),
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: rs(64), // زيادة بسيطة لراحة اللمس
          paddingBottom: rs(6),
          shadowColor: Colors.shadow,
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
          elevation: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'الامتحانات',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'book' : 'book-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'الحساب',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}