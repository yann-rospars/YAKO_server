import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import TrailerScreen from '../screens/TrailerScreen';

export type HomeStackParamList = {
  Home: undefined;
  MovieDetail: { movieId: number };
  Trailer: { youtubeKey: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MovieDetail"
        component={MovieDetailScreen}
        options={{ title: 'Film' }}
      />
      <Stack.Screen
        name="Trailer"
        component={TrailerScreen}
        options={{ title: 'Bande-annonce' }}
      />
    </Stack.Navigator>
  );
}
