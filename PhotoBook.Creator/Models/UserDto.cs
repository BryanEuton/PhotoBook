using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models
{
    public class UserDto
    {
        /// <summary>
        /// Gets the primary key for this user.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// The user's first name.
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// The user's last name.
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// The user's desired display name.
        /// </summary>
        public string DisplayName { get; set; }

        public bool IsAdmin { get; set; }
        /// <summary>
        /// User has no real permissions.  Can be considered as a read only user.
        /// </summary>
        public bool IsGuest { get; set; }
        public bool IsActive { get; set; }

        /// <summary>
        /// The user's full name.
        /// </summary>
        public string FullName
        {
            get
            {
                if (!string.IsNullOrWhiteSpace(FirstName) &&
                    !string.IsNullOrWhiteSpace(LastName))
                {
                    return $"{FirstName} {LastName}";
                }

                return string.Empty;
            }
        }

    }
}
