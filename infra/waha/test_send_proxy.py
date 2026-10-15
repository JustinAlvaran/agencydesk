import unittest
from send_proxy import validate


class PayloadGuards(unittest.TestCase):
    def payload(self, **values):
        return dict({'session': 'default', 'chatId': '639123456789@c.us', 'text': 'Fictional test', 'linkPreview': False}, **values)

    def test_valid_payload(self):
        self.assertEqual(validate(self.payload(), 'default')['text'], 'Fictional test')

    def test_cannot_select_another_session(self):
        with self.assertRaises(ValueError): validate(self.payload(session='other'), 'default')

    def test_cannot_send_groups_or_links_as_destination(self):
        for chat in ['123@g.us', 'https://other.invalid', '09123456789@c.us']:
            with self.assertRaises(ValueError): validate(self.payload(chatId=chat), 'default')

    def test_cannot_inject_extra_send_options(self):
        with self.assertRaises(ValueError): validate(self.payload(quotedMessageId='other'), 'default')

    def test_cannot_enable_link_fetching(self):
        with self.assertRaises(ValueError): validate(self.payload(linkPreview=True), 'default')

    def test_rejects_empty_and_overlong_text(self):
        for text in [' ', 'x' * 5001]:
            with self.assertRaises(ValueError): validate(self.payload(text=text), 'default')


if __name__ == '__main__': unittest.main()
