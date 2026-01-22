import { View, TextInput } from 'react-native';

export default function HeaderSearch() {
  return (
    <View style={{ padding: 12 }}>
      <TextInput
        placeholder="Rechercher un film, un cinéma..."
        style={{
          backgroundColor: '#eee',
          padding: 12,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
