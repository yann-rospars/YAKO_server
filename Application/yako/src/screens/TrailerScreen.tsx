import { View, Text, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type TrailerRouteProp = RouteProp<
  HomeStackParamList,
  'Trailer'
>;

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList
>;

export default function TrailerScreen() {
  const route = useRoute<TrailerRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { youtubeKey } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      
      {/* Header */}
      <View
        style={{
          height: 60,
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 16 }}>
            ← Retour au film
          </Text>
        </Pressable>
      </View>

      {/* Trailer */}
      <View
        style={{
          height: 220,               // ⬅️ hauteur MAX
          marginHorizontal: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        <WebView
          source={{
            uri: `https://www.youtube.com/watch?app=desktop&v=${youtubeKey}`,
          }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}      // ⬅️ essentiel
          allowsFullscreenVideo
        />
      </View>

      {/* Espace vide (respiration UX) */}
      <View style={{ flex: 1 }} />
    </View>
  );
}
