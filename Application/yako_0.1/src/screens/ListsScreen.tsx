import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { C } from '../theme/colors'

type ListWithCount = {
  id: number
  name: string
  type: 'system' | 'custom'
  is_public: boolean
  movie_count: number
}

export default function ListsScreen({ navigation }: any) {
  const [lists, setLists] = useState<ListWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchLists()
    }, [])
  )

  const fetchLists = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Récupère les listes + le count de films via la relation list_movies
    const { data, error } = await supabase
      .from('lists')
      .select('id, name, type, is_public, list_movies(count)')
      .eq('user_id', user.id)
      .order('type', { ascending: false }) // system en premier
      .order('name', { ascending: true })

    if (error) { console.error(error); setLoading(false); return }

    const formatted: ListWithCount[] = (data ?? []).map((l: any) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      is_public: l.is_public,
      movie_count: l.list_movies?.[0]?.count ?? 0,
    }))

    setLists(formatted)
    setLoading(false)
  }

  const createList = async () => {
    const name = newListName.trim()
    if (!name) return

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const { error } = await supabase
      .from('lists')
      .insert({ user_id: user.id, name, type: 'custom', is_public: false })

    setCreating(false)

    if (error) {
      if (error.code === '23505') {
        alert('Tu as déjà une liste avec ce nom.')
      } else {
        alert('Erreur lors de la création.')
        console.error(error)
      }
      return
    }

    setNewListName('')
    setModalVisible(false)
    fetchLists()
  }
  const systemLists = lists.filter(l => l.type === 'system')
  const customLists = lists.filter(l => l.type === 'custom')

  const renderBubble = ({ item }: { item: ListWithCount }) => (
    <TouchableOpacity
      style={[styles.bubble, item.type === 'system' && styles.bubbleSystem]}
      onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
      activeOpacity={0.75}
    >
      {item.type === 'system' && (
        <Text style={styles.systemBadge}>SYSTÈME</Text>
      )}
      <Text style={styles.bubbleName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.countRow}>
        <Text style={styles.countNumber}>{item.movie_count}</Text>
        <Text style={styles.countLabel}>{item.movie_count === 1 ? 'film' : 'films'}</Text>
      </View>
      {item.is_public && <Text style={styles.publicTag}>🌐 publique</Text>}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes listes</Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.container}>

            {/* LISTES SYSTÈME */}
            {systemLists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Listes par défaut</Text>
                <View style={styles.grid}>
                  {systemLists.map(item => (
                    <View key={item.id} style={styles.bubbleWrapper}>
                      {renderBubble({ item })}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* LISTES CUSTOM */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mes listes</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.addBtnText}>+ Nouvelle</Text>
                </TouchableOpacity>
              </View>

              {customLists.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Aucune liste personnalisée</Text>
                  <Text style={styles.emptyHint}>Crée ta première liste pour organiser tes films</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {customLists.map(item => (
                    <View key={item.id} style={styles.bubbleWrapper}>
                      {renderBubble({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>
        }
        keyExtractor={() => 'header'}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* MODAL NOUVELLE LISTE */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nouvelle liste</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de la liste"
              placeholderTextColor={C.muted}
              value={newListName}
              onChangeText={setNewListName}
              maxLength={30}
              autoFocus
              onSubmitEditing={createList}
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{newListName.length}/30</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setNewListName('') }}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, (!newListName.trim() || creating) && styles.confirmBtnDisabled]}
                onPress={createList}
                disabled={!newListName.trim() || creating}
              >
                {creating
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.confirmText}>Créer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  )
}

const BUBBLE_SIZE = 150

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    paddingBottom: 8,
  },

  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: { color: C.text, fontSize: 20, fontWeight: 'bold' },

  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
  },

  container: {
    padding: 16,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  addBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  bubbleWrapper: {
    width: BUBBLE_SIZE,
  },

  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    justifyContent: 'space-between',
  },

  bubbleSystem: {
    borderColor: C.accent,
    borderWidth: 1.5,
  },

  systemBadge: {
    color: C.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  bubbleName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginTop: 4,
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  countNumber: {
    color: C.accent,
    fontSize: 22,
    fontWeight: '900',
  },

  countLabel: {
    color: C.muted,
    fontSize: 12,
  },

  publicTag: {
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
  },

  emptyBox: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },

  emptyText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },

  emptyHint: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalBox: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    width: '100%',
  },

  modalTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },

  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    color: C.text,
    fontSize: 15,
  },

  charCount: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },

  cancelText: {
    color: C.muted,
    fontWeight: '600',
    fontSize: 14,
  },

  confirmBtn: {
    flex: 1,
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },

  confirmBtnDisabled: {
    opacity: 0.4,
  },

  confirmText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
})
