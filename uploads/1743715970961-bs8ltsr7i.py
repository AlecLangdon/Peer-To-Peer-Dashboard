# Saving your .PY file: ITSE_1359+Group Name +Last Name, First Name +Cipher Text Project
alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

direction = input("Type 'encode' to encrypt, type 'decode' to decrypt:\n")
text = input("Type your message:\n").lower()
shift = int(input("Type the shift number:\n"))

#TODO-1: Create a function called 'encrypt' that takes the 'text' and 'shift' as inputs.

    #TODO-1.a: Inside the 'encrypt' function, shift each letter of the 'text' forwards in the alphabet
    #by the shift amount and print the encrypted text.  
    #e.g. 
    #plain_text = "hello"
    #shift = 5
    #cipher_text = "mjqqt"
    #print output: "The encoded text is mjqqt"

    ##HINT: How do you get the index of an item in a list:
    #https://stackoverflow.com/questions/176918/finding-the-index-of-an-item-in-a-list

    #1.b🐛Bug alert: What happens if you try to encode the word 'civilization'?🐛

#TODO-1.c: Call the encrypt function and pass in the user inputs. You should be able to test the code and encrypt a message.
#######Checkpoint##########

#TODO-2: Create a different function called 'decrypt' that takes the 'text' and 'shift' as inputs.
def decrypt(cipher_text, shift_amount):
  #TODO-2.a: Inside the 'decrypt' function, shift each letter of the 'text' *backwards* in the alphabet by
  #the shift amount and print the decrypted text.  
  #e.g. 
  #cipher_text = "mjqqt"
  #shift = 5
  #plain_text = "hello"
  #print output: "The decoded text is hello"

#TODO-3: Check if the user wanted to encrypt or decrypt the message by checking the 'direction' variable.

#3.a. Call the correct function based on that 'drection' variable. You should be able to test the code to encrypt *AND* decrypt a message.
