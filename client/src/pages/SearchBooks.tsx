import { useState } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row
} from 'react-bootstrap';

import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../utils/mutations';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { Book } from '../models/Book';
import { GoogleAPIBook } from '../models/GoogleAPIBook';

import Auth from '../utils/auth';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [saveBook] = useMutation(SAVE_BOOK); // Apollo useMutation hook

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchInput}`);
    if (!response.ok) {
      console.error('Error fetching data from Google Books API:', response.statusText);
      return;
    }

    const { items } = await response.json();

    const bookData = items.map((book: GoogleAPIBook) => ({
      bookId: book.id,
      authors: book.volumeInfo.authors || ['No author to display'],
      title: book.volumeInfo.title,
      description: book.volumeInfo.description,
      image: book.volumeInfo.imageLinks?.thumbnail || '',
    }));

    setSearchedBooks(bookData);
    setSearchInput('');
  };

  const handleSaveBook = async (bookId: string) => { 
    // Find the book in `searchedBooks` state by the matching id
    const bookToSave: Book = searchedBooks.find((book: Book) => book.bookId === bookId)!;
    // Get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) {
      return false;
    }
    try {
      // Execute the SAVE_BOOK mutation
      await saveBook({
        variables: { bookInput: { ...bookToSave } },
      });
  
      // Save book ID to local storage
      const savedBookIds = getSavedBookIds();
      saveBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book: Book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border="dark" className='mb-3'>
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className="small">Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={getSavedBookIds()?.some(
                          (savedId: string) => savedId === book.bookId
                        )}
                        className="btn-block btn-info"
                        onClick={() => handleSaveBook(book.bookId)}
                      >
                        {getSavedBookIds()?.some((savedId: string) => savedId === book.bookId)
                          ? 'Book Already Saved!'
                          : 'Save This Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
