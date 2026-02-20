// Component Mapper: React (Web) → React Native (Mobile)
// Maps web components to mobile equivalents for cross-platform generation

export interface ComponentMapping {
  web: string;
  mobile: string;
  props: Record<string, string>;
}

export const componentMappings: ComponentMapping[] = [
  // Layout
  { web: "div", mobile: "View", props: { className: "style" } },
  { web: "span", mobile: "Text", props: {} },
  { web: "p", mobile: "Text", props: {} },
  { web: "h1", mobile: "Text", props: {} },
  
  // Inputs
  { web: "input", mobile: "TextInput", props: { 
    type: "keyboardType",
    placeholder: "placeholder",
    value: "value",
    onChange: "onChangeText"
  }},
  { web: "button", mobile: "TouchableOpacity", props: {
    onClick: "onPress"
  }},
  
  // Images
  { web: "img", mobile: "Image", props: {
    src: "source"
  }},
  
  // Lists
  { web: "ul/li", mobile: "FlatList", props: {} },
  
  // Navigation
  { web: "a", mobile: "TouchableOpacity", props: {
    href: "onPress"
  }}
];

// Style mappings
export const styleMappings: Record<string, string> = {
  "flex": "flex",
  "flex-col": "flexDirection: 'column'",
  "flex-row": "flexDirection: 'row'",
  "items-center": "alignItems: 'center'",
  "justify-center": "justifyContent: 'center'",
  "p-4": "padding: 16",
  "m-4": "margin: 16",
  "rounded": "borderRadius: 8",
  "bg-white": "backgroundColor: '#fff'",
  "text-center": "textAlign: 'center'",
  "font-bold": "fontWeight: 'bold'"
};

export function mapWebToMobile(webCode: string): string {
  let mobileCode = webCode;
  
  // Replace imports
  mobileCode = mobileCode.replace(
    /import.*from ['"]react['"];?/g,
    "import React from 'react';\nimport { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet } from 'react-native';"
  );
  
  // Replace className with style
  mobileCode = mobileCode.replace(/className=/g, 'style={styles.');
  mobileCode = mobileCode.replace(/className="([^"]+)"/g, (match, classes) => {
    const styleNames = classes.split(' ').map((c: string) => c.replace(/-/g, '_')).join('_');
    return `style={styles.${styleNames}}`;
  });
  
  // Replace onClick with onPress
  mobileCode = mobileCode.replace(/onClick=/g, 'onPress=');
  
  // Replace div tags
  mobileCode = mobileCode.replace(/<div/g, '<View');
  mobileCode = mobileCode.replace(/<\/div>/g, '</View>');
  
  // Replace span/p/h1 tags with Text
  mobileCode = mobileCode.replace(/<(span|p|h[1-6])/g, '<Text');
  mobileCode = mobileCode.replace(/<\/(span|p|h[1-6])>/g, '</Text>');
  
  // Replace input
  mobileCode = mobileCode.replace(/<input/g, '<TextInput');
  mobileCode = mobileCode.replace(/<\/input>/g, '</TextInput>');
  
  // Add styles at the end
  const stylesSection = generateStylesSection(webCode);
  mobileCode += '\n\n' + stylesSection;
  
  return mobileCode;
}

function generateStylesSection(webCode: string): string {
  const styles: string[] = [];
  const classMatches = webCode.match(/className="([^"]+)"/g) || [];
  
  classMatches.forEach(match => {
    const classes = match.replace(/className="([^"]+)"/, '$1').split(' ');
    const styleName = classes.join('_').replace(/-/g, '_');
    const styleProps = classes
      .map((c: string) => styleMappings[c])
      .filter(Boolean)
      .join(',\n    ');
    
    if (styleProps) {
      styles.push(`  ${styleName}: {\n    ${styleProps}\n  }`);
    }
  });
  
  if (styles.length === 0) {
    styles.push('  container: {\n    flex: 1,\n    padding: 16\n  }');
  }
  
  return `const styles = StyleSheet.create({\n${styles.join(',\n')}\n});`;
}
