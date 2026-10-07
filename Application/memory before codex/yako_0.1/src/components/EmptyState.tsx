import {
  StyleSheet,
  Text,
  View,
} from 'react-native'

type EmptyStateProps = {
  icon: string
  title: string
  description: string
}

export default function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
    paddingHorizontal: 35,
    paddingTop: 45,
    alignItems: 'center',
  },

  badge: {
    width: 68,
    height: 68,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE17A',
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 18,

    shadowColor: '#111111',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 5,
  },

  icon: {
    fontSize: 29,
  },

  title: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  description: {
    maxWidth: 290,
    marginTop: 10,
    color: '#777777',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
})