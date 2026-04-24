import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Logo } from '../components/logo';
import { homeStyles } from './styles/home.styles';


export default function App() {
  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.contentContainer}>
        <Text style={homeStyles.bienvenido}>Bienvenido</Text>
        
        <Logo />
        
        <TouchableOpacity style={homeStyles.boton}>
          <Text style={homeStyles.textoBoton}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}