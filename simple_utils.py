# simple_utils.py - A tiny utility library

def reverse_string(text):
    """Reverses the characters in a string."""
    return text[::-1]

def count_words(sentence):
    """Count the words in a sentence separated by whitespace.
    
    Parameters:
    	sentence (str): The text whose words are counted.
    
    Returns:
    	int: The number of whitespace-separated words.
    """
    return len(sentence.split())

def celsius_to_fahrenheit(celsius):
    """
    Convert a temperature from Celsius to Fahrenheit.
    
    Parameters:
        celsius: The temperature in degrees Celsius.
    
    Returns:
        The equivalent temperature in degrees Fahrenheit.
    """
    return (celsius * 9/5) + 32