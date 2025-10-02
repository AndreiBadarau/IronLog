import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

type FormData = { email: string; password: string };

export default function LoginScreen() {
  const {login, loading} = useAuth();
  const {control, handleSubmit} = useForm<FormData>({defaultValues: {email: '', password: ''}});
  return (
    <View style={{padding: 16, gap: 12}}>
      <Controller control={control} name="email" rules={{required: 'Email required'}}
        render={({field: {onChange, value}}) => (
          <TextInput style={{borderWidth:1, padding:11, borderRadius:8}} value={value} onChangeText={onChange}
            autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        )}/>
      <Controller control={control} name="password" rules={{required: 'Password required'}}
        render={({field: {onChange, value}}) => (
          <TextInput style={{borderWidth:1, padding:9, borderRadius:8}} value={value} onChangeText={onChange}
            secureTextEntry placeholder="Password" />
        )}/>
      <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSubmit(d => login(d.email, d.password))} />
    </View>
  );
}
